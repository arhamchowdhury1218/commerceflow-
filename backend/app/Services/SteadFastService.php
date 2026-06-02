<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SteadFastService
{
    private string $baseUrl;
    private string $apiKey;
    private string $secretKey;

    public function __construct()
    {
        // Read credentials from config/services.php
        // which reads from .env file
        $this->baseUrl   = config('services.steadfast.base_url');
        $this->apiKey    = config('services.steadfast.api_key');
        $this->secretKey = config('services.steadfast.secret_key');
    }

    // Build headers required by every SteadFast API request
    private function headers(): array
    {
        return [
            'Api-Key'    => $this->apiKey,
            'Secret-Key' => $this->secretKey,
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Create a consignment (book a parcel) with SteadFast
     * Called when seller confirms an order with SteadFast as courier
     *
     * @param  \App\Models\Order $order
     * @return array { success, consignment_id, tracking_code, message }
     */
    public function createConsignment($order): array
    {
        try {

            // ── TEST MODE ─────────────────────────────────────────────────────────
            // Set STEADFAST_TEST_MODE=true in .env to skip real API calls
            // Returns fake tracking number so you can test the full flow
            if (config('services.steadfast.test_mode')) {
                return [
                    'success'        => true,
                    'consignment_id' => 'TEST-' . rand(100000, 999999),
                    'tracking_code'  => 'TC-' . strtoupper(substr(md5($order->id . time()), 0, 8)),
                    'message'        => 'Test mode — no real API call made',
                ];
            }
            // ── END TEST MODE ─────────────────────────────────────────────────────



            // Build the payload SteadFast expects
            $payload = [
                // Invoice = our internal order ID
                // SteadFast uses this to identify the order on their side
                'invoice'           => 'CF-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),

                'recipient_name'    => $order->customer->name,
                'recipient_phone'   => $order->customer->phone,
                'recipient_address' => $order->customer->delivery_address
                    ?? 'Address not provided',

                // cod_amount = Cash on Delivery amount
                // If already paid → 0 (no COD collection needed)
                // If unpaid → full amount (SteadFast collects it)
                'cod_amount'        => $order->payment_status === 'paid'
                    ? 0
                    : (float) $order->total_amount,

                // Optional but useful
                'note'              => $order->notes ?? '',
                'item_description'  => $this->buildItemDescription($order),
            ];

            $response = Http::withHeaders($this->headers())
                ->post("{$this->baseUrl}/create_order", $payload);

            if ($response->successful()) {
                $data = $response->json();

                // SteadFast returns consignment data on success
                return [
                    'success'        => true,
                    'consignment_id' => $data['consignment']['consignment_id'] ?? null,
                    'tracking_code'  => $data['consignment']['tracking_code']  ?? null,
                    'message'        => 'Consignment created successfully',
                ];
            }

            // Log failed response for debugging
            Log::error('SteadFast create consignment failed', [
                'order_id' => $order->id,
                'response' => $response->body(),
                'status'   => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => $response->json('message') ?? 'SteadFast API error',
            ];
        } catch (\Exception $e) {
            Log::error('SteadFast service exception', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Could not connect to SteadFast: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get delivery status by consignment ID
     * Called to sync latest status from SteadFast
     *
     * @param  string $consignmentId
     * @return array { success, status, message }
     */
    public function getStatusByConsignmentId(string $consignmentId): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/status_by_cid/{$consignmentId}");

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'status'  => $data['delivery_status'] ?? 'unknown',
                    'data'    => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not fetch status',
            ];
        } catch (\Exception $e) {
            Log::error('SteadFast status check failed', [
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
     * Get status by tracking code
     * Alternative to consignment ID tracking
     */
    public function getStatusByTrackingCode(string $trackingCode): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/status_by_trackingcode/{$trackingCode}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data'    => $response->json(),
                    'status'  => $response->json('delivery_status') ?? 'unknown',
                ];
            }

            return ['success' => false, 'message' => 'Tracking failed'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Get current SteadFast account balance
     * Useful to show in Settings page
     */
    public function getBalance(): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/get_balance");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'balance' => $response->json('current_balance') ?? 0,
                ];
            }

            return ['success' => false, 'message' => 'Could not fetch balance'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Map SteadFast delivery status to our internal status
     * SteadFast uses different status strings than our system
     */
    public function mapStatus(string $steadfastStatus): string
    {
        return match (strtolower($steadfastStatus)) {
            'delivered'                    => 'delivered',
            'partial_delivered'            => 'delivered',
            'cancelled'                    => 'cancelled',
            'hold'                         => 'shipped',
            'in_review'                    => 'shipped',
            'unknown', 'return', 'partial_return' => 'returned',
            default                        => 'shipped',
        };
    }

    /**
     * Build a readable item description from order items
     * Shown to SteadFast for package identification
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
