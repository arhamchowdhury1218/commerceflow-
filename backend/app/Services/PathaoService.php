<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PathaoService
{
    private string $baseUrl;
    private string $clientId;
    private string $clientSecret;
    private string $username;
    private string $password;
    private ?string $storeId;

    public function __construct()
    {
        // Read credentials from config/services.php
        // which reads from .env file
        $this->baseUrl      = config('services.pathao.base_url');
        $this->clientId     = config('services.pathao.client_id');
        $this->clientSecret = config('services.pathao.client_secret');
        $this->username     = config('services.pathao.username');
        $this->password     = config('services.pathao.password');
        $this->storeId      = config('services.pathao.store_id');
    }

    /**
     * Pathao uses OAuth2 — unlike SteadFast/RedX which use a static API key,
     * Pathao requires exchanging credentials for a short-lived access_token.
     *
     * We cache the token so we don't re-authenticate on every single request.
     * Pathao tokens are typically valid for a number of hours — we cache
     * conservatively for 50 minutes to stay safely within that window.
     */
    private function getAccessToken(): ?string
    {
        return Cache::remember('pathao_access_token', 50 * 60, function () {
            $response = Http::post("{$this->baseUrl}/aladdin/api/v1/issue-token", [
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
                'username'      => $this->username,
                'password'      => $this->password,
                'grant_type'    => 'password',
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error('Pathao token issue failed', [
                'response' => $response->body(),
                'status'   => $response->status(),
            ]);

            return null;
        });
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->getAccessToken(),
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ];
    }

    /**
     * Create a consignment (book a parcel) with Pathao
     * Called when seller confirms an order with Pathao as courier
     *
     * @param  \App\Models\Order $order
     * @return array { success, consignment_id, tracking_code, message }
     */
    public function createConsignment($order): array
    {
        try {

            // ── TEST MODE ─────────────────────────────────────────────────────────
            // Set PATHAO_TEST_MODE=true in .env to skip real API calls
            if (config('services.pathao.test_mode')) {
                return [
                    'success'        => true,
                    'consignment_id' => 'PTEST-' . rand(100000, 999999),
                    'tracking_code'  => 'PA-' . strtoupper(substr(md5($order->id . time()), 0, 8)),
                    'message'        => 'Test mode — no real API call made',
                ];
            }
            // ── END TEST MODE ─────────────────────────────────────────────────────

            if (!$this->storeId) {
                return [
                    'success' => false,
                    'message' => 'Pathao store ID is not configured. Set it in Settings before booking.',
                ];
            }

            $payload = [
                'store_id'            => $this->storeId,
                'merchant_order_id'   => 'CF-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'recipient_name'      => $order->customer->name,
                'recipient_phone'     => $order->customer->phone,
                'recipient_address'   => $order->customer->delivery_address
                    ?? 'Address not provided',

                // Pathao requires city/zone IDs from their location API.
                // For Phase 2 these can default to a configured fallback zone
                // until a proper city/zone picker is added to the order form.
                'recipient_city'      => config('services.pathao.default_city_id'),
                'recipient_zone'      => config('services.pathao.default_zone_id'),

                'delivery_type'       => 48, // Normal delivery
                'item_type'           => 2,  // Parcel
                'special_instruction' => $order->notes ?? '',
                'item_quantity'       => max(1, $order->items->sum('quantity')),
                'item_weight'         => 0.5,
                'item_description'    => $this->buildItemDescription($order),

                // amount_to_collect = Cash on Delivery amount
                // If already paid → 0 (no COD collection needed)
                // Collect only what's still owed: total minus anything
                // already paid (e.g. a bKash advance). Fully-paid → 0.
                'amount_to_collect'   => max(
                    0,
                    (float) $order->total_amount - (float) $order->paid_amount
                ),
            ];

            $response = Http::withHeaders($this->headers())
                ->post("{$this->baseUrl}/aladdin/api/v1/orders", $payload);

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'success'        => true,
                    'consignment_id' => $data['data']['consignment_id'] ?? null,
                    'tracking_code'  => $data['data']['consignment_id'] ?? null,
                    // Pathao uses the same consignment_id for tracking
                    'message'        => 'Consignment created successfully',
                ];
            }

            Log::error('Pathao create consignment failed', [
                'order_id' => $order->id,
                'response' => $response->body(),
                'status'   => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => $response->json('message') ?? 'Pathao API error',
            ];
        } catch (\Exception $e) {
            Log::error('Pathao service exception', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Could not connect to Pathao: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get delivery status by consignment ID
     * Called to sync latest status from Pathao
     *
     * @param  string $consignmentId
     * @return array { success, status, message }
     */
    public function getStatusByConsignmentId(string $consignmentId): array
    {
        try {
            if (config('services.pathao.test_mode')) {
                return [
                    'success' => true,
                    'status'  => 'pending',
                ];
            }

            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/aladdin/api/v1/orders/{$consignmentId}/info");

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'status'  => $data['data']['order_status'] ?? 'unknown',
                    'data'    => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not fetch status',
            ];
        } catch (\Exception $e) {
            Log::error('Pathao status check failed', [
                'consignment_id' => $consignmentId,
                'error'          => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Pathao does not expose a simple prepaid balance endpoint the same way
     * SteadFast does (Pathao merchants are typically invoiced separately).
     * We return a friendly "not supported" response so Settings can show
     * an accurate message instead of a confusing error.
     */
    public function getBalance(): array
    {
        return [
            'success' => false,
            'message' => 'Pathao does not provide a balance check via API.',
        ];
    }

    /**
     * Map Pathao delivery status to our internal status
     * Pathao uses different status strings than our system
     */
    public function mapStatus(string $pathaoStatus): string
    {
        return match (strtolower($pathaoStatus)) {
            'delivered'                              => 'delivered',
            'partial_delivered'                      => 'delivered',
            'cancelled'                               => 'cancelled',
            'pickup_requested', 'assigned_for_pickup',
            'picked_up', 'at_the_sorting_hub',
            'in_transit', 'received_at_last_mile_hub' => 'in_transit',
            'pending'                                 => 'pending',
            'return', 'partial_return', 'paid_return' => 'returned',
            default                                   => 'pending',
        };
    }

    /**
     * Build a readable item description from order items
     * Shown to Pathao for package identification
     */
    private function buildItemDescription($order): string
    {
        if (!$order->items || $order->items->isEmpty()) {
            return 'Goods';
        }

        return $order->items
            ->map(
                fn($item) => ($item->variant->product->name ?? 'Item') .
                    ' x' . $item->quantity
            )
            ->join(', ');
    }
}
