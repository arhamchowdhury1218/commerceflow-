<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MessengerService
{
    private string $graphUrl;

    public function __construct()
    {
        $version        = config('services.facebook.graph_version', 'v21.0');
        $this->graphUrl = "https://graph.facebook.com/{$version}";
    }

    public function sendMessage(string $pageToken, string $psid, string $text): array
    {
        try {
            $response = Http::withToken($pageToken)
                ->post("{$this->graphUrl}/me/messages", [
                    'recipient'      => ['id' => $psid],
                    'messaging_type' => 'RESPONSE',
                    'message'        => ['text' => $text],
                ]);

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Sent'];
            }

            Log::error('Messenger send failed', [
                'psid'     => $psid,
                'response' => $response->body(),
                'status'   => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => $response->json('error.message') ?? 'Send failed',
            ];
        } catch (\Exception $e) {
            Log::error('Messenger send exception', [
                'psid'  => $psid,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function fetchProfileName(string $pageToken, string $psid): ?string
    {
        try {
            $response = Http::withToken($pageToken)
                ->get("{$this->graphUrl}/{$psid}", [
                    'fields' => 'first_name,last_name',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $name = trim(
                    ($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')
                );
                return $name !== '' ? $name : null;
            }

            return null;
        } catch (\Exception $e) {
            Log::info('Messenger profile fetch failed', [
                'psid'  => $psid,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
