<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\MessengerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    private MessengerService $messenger;

    public function __construct(MessengerService $messenger)
    {
        $this->messenger = $messenger;
    }

    // ── GET /api/webhooks/messenger ──────────────────────────────────────────
    // Facebook's one-time verification handshake.
    // When you save the webhook URL in the Facebook dashboard, Facebook
    // sends a GET request with a challenge. We must echo the challenge back
    // ONLY if the verify token matches the one we configured — this proves
    // we own this endpoint.
    public function verify(Request $request)
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $expected = config('services.facebook.verify_token');

        if ($mode === 'subscribe' && $token === $expected) {
            // Echo the challenge back as plain text — Facebook requires this
            return response($challenge, 200)
                ->header('Content-Type', 'text/plain');
        }

        // Wrong token or mode → reject
        return response('Verification failed', 403);
    }

    // ── POST /api/webhooks/messenger ─────────────────────────────────────────
    // Facebook calls this every time a message event happens on a connected
    // page. We ALWAYS return 200 quickly — if we don't, Facebook retries and
    // eventually disables the webhook. So we process defensively and never
    // let an error bubble into a non-200 response.
    public function handle(Request $request)
    {
        $payload = $request->all();

        // Facebook only sends 'page' object events for Messenger
        if (($payload['object'] ?? null) !== 'page') {
            return response('ok', 200);
        }

        try {
            foreach ($payload['entry'] ?? [] as $entry) {
                // The page this event is for
                $pageId = $entry['id'] ?? null;

                foreach ($entry['messaging'] ?? [] as $event) {
                    $this->processMessagingEvent($pageId, $event);
                }
            }
        } catch (\Exception $e) {
            // Log but STILL return 200 — never make Facebook retry
            Log::error('Webhook processing error', [
                'error' => $e->getMessage(),
            ]);
        }

        return response('ok', 200);
    }

    // Process a single messaging event from the webhook payload
    private function processMessagingEvent(?string $pageId, array $event): void
    {
        // We only care about actual messages with text for now
        // (ignore delivery receipts, read receipts, echoes of our own
        //  outgoing messages, etc.)
        if (!isset($event['message']['text'])) {
            return;
        }

        // Ignore "echo" events — these are copies of messages WE sent,
        // which Facebook echoes back. Storing them would duplicate our
        // own replies as if they were incoming.
        if (($event['message']['is_echo'] ?? false) === true) {
            return;
        }

        $psid     = $event['sender']['id'] ?? null;
        $text     = $event['message']['text'];
        $fbMsgId  = $event['message']['mid'] ?? null;

        if (!$psid || !$pageId) {
            return;
        }

        // Find which seller owns this page
        $business = Business::where('facebook_page_id', $pageId)->first();

        // Fallback for early testing: if no business has this exact page_id
        // saved yet, attach to the first/only business so messages still
        // land somewhere visible. Remove this fallback once pages are
        // properly linked per seller.
        if (!$business) {
            $business = Business::first();
        }

        if (!$business) {
            Log::warning('Webhook message for unknown page', ['page_id' => $pageId]);
            return;
        }

        // Find or create the conversation for this customer
        $conversation = Conversation::firstOrCreate(
            [
                'business_id' => $business->id,
                'psid'        => $psid,
            ],
            [
                'is_read' => false,
            ]
        );

        // Try to fetch the customer's name if we don't have it yet
        if (!$conversation->customer_name && $business->facebook_page_token) {
            $name = $this->messenger->fetchProfileName(
                $business->facebook_page_token,
                $psid
            );
            if ($name) {
                $conversation->customer_name = $name;
            }
        }

        // Store the incoming message (skip if we've already stored this mid)
        if ($fbMsgId && Message::where('fb_message_id', $fbMsgId)->exists()) {
            return; // duplicate webhook delivery — ignore
        }

        Message::create([
            'conversation_id' => $conversation->id,
            'direction'       => 'customer',
            'text'            => $text,
            'fb_message_id'   => $fbMsgId,
        ]);

        // Update the conversation preview + unread state
        $conversation->last_message    = mb_substr($text, 0, 120);
        $conversation->last_message_at = now();
        $conversation->is_read         = false;
        $conversation->save();
    }
}
