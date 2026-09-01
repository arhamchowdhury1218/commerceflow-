<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\MessengerService;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    private MessengerService $messenger;

    public function __construct(MessengerService $messenger)
    {
        $this->messenger = $messenger;
    }

    // GET /api/conversations
    public function index(Request $request)
    {
        $businessId = $request->user()->business->id;

        $conversations = Conversation::where('business_id', $businessId)
            ->orderByDesc('last_message_at')
            ->get();

        return response()->json($conversations);
    }

    // GET /api/conversations/{conversation}
    public function show(Request $request, Conversation $conversation)
    {
        if ($conversation->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $conversation->update(['is_read' => true]);
        $conversation->load('messages');

        return response()->json($conversation);
    }

    // POST /api/conversations/{conversation}/reply
    public function reply(Request $request, Conversation $conversation)
    {
        if ($conversation->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'text' => 'required|string|max:2000',
        ]);

        $business = $conversation->business;

        if (!$business->facebook_page_token) {
            return response()->json([
                'error' => 'No Facebook page token configured. Connect your page in Settings.',
            ], 422);
        }

        $result = $this->messenger->sendMessage(
            $business->facebook_page_token,
            $conversation->psid,
            $request->text
        );

        if (!$result['success']) {
            return response()->json([
                'error'   => 'Could not send message',
                'message' => $result['message'],
            ], 422);
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'direction'       => 'seller',
            'text'            => $request->text,
        ]);

        $conversation->update([
            'last_message'    => mb_substr($request->text, 0, 120),
            'last_message_at' => now(),
            'is_read'         => true,
        ]);

        return response()->json([
            'message'      => 'Reply sent',
            'chat_message' => $message,
        ]);
    }
}
