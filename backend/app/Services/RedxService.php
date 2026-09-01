<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RedxService
{
    private string $baseUrl;
    private string $apiToken;
    private ?string $pickupStoreId;

    public function __construct()
    {
        // Read credentials from config/services.php
        // which reads from .env file
        $this->baseUrl       = config('services.redx.base_url');
        $this->apiToken      = config('services.redx.api_token');
        $this->pickupStoreId = config('services.redx.pickup_store_id');
    }

    // Build headers required by every RedX API request
    private function headers(): array
    {
        return [
            'API-ACCESS-TOKEN' => 'Bearer ' . $this->apiToken,
            'Content-Type'     => 'application/json',
            'Accept'           => 'application/json',
        ];
    }

    /**
     * Create a consignment (book a parcel) with RedX
     * Called when seller confirms an order with RedX as courier
     *
     * @param  \App\Models\Order $order
     * @return array { success, consignment_id, tracking_code, message }
     */
    public function createConsignment($order): array
    {
        try {

            // ── TEST MODE ─────────────────────────────────────────────────────────
            // Set REDX_TEST_MODE=true in .env to skip real API calls
            if (config('services.redx.test_mode')) {
                return [
                    'success'        => true,
                    'consignment_id' => 'RTEST-' . rand(100000, 999999),
                    'tracking_code'  => 'RX-' . strtoupper(substr(md5($order->id . time()), 0, 8)),
                    'message'        => 'Test mode — no real API call made',
                ];
            }
            // ── END TEST MODE ─────────────────────────────────────────────────────

            $payload = [
                'customer_name'         => $order->customer->name,
                'customer_phone'        => $order->customer->phone,
                'delivery_area'         => config('services.redx.default_area', ''),
                'delivery_area_id'      => config('services.redx.default_area_id'),
                'customer_address'      => $order->customer->delivery_address
                    ?? 'Address not provided',

                // RedX calls the merchant invoice number "merchant_invoice_id"
                'merchant_invoice_id'   => 'CF-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),

                // Collect only what's still owed: total minus anything
                // already paid (e.g. a bKash advance). Fully-paid → 0.
                'cash_collection_amount' => max(
                    0,
                    (float) $order->total_amount - (float) $order->paid_amount
                ),

                'parcel_weight'  => 500, // grams, default estimate
                'instruction'    => $order->notes ?? '',
                'value'          => (float) $order->total_amount,

                // RedX requires which pickup store (registered pickup address)
                // the parcel should be collected from. Sourced from your
                // RedX merchant dashboard's pickup store list.
                'pickup_store_id' => $this->pickupStoreId,

                // RedX expects parcel_details_json as an array of item objects,
                // each with name/category/value — NOT a plain string.
                'parcel_details_json' => $this->buildParcelDetails($order),
            ];

            $response = Http::withHeaders($this->headers())
                ->post("{$this->baseUrl}/parcel", $payload);

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'success'        => true,
                    'consignment_id' => $data['tracking_id'] ?? null,
                    'tracking_code'  => $data['tracking_id'] ?? null,
                    'message'        => 'Consignment created successfully',
                ];
            }

            Log::error('RedX create consignment failed', [
                'order_id' => $order->id,
                'response' => $response->body(),
                'status'   => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => $response->json('message') ?? 'RedX API error',
            ];
        } catch (\Exception $e) {
            Log::error('RedX service exception', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Could not connect to RedX: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get delivery status by tracking ID (RedX calls it consignment_id
     * on our side to stay consistent with the deliveries table column)
     *
     * @param  string $consignmentId
     * @return array { success, status, message }
     */
    public function getStatusByConsignmentId(string $consignmentId): array
    {
        try {
            if (config('services.redx.test_mode')) {
                return [
                    'success' => true,
                    'status'  => 'pending',
                ];
            }

            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/parcel/track/{$consignmentId}");

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'status'  => $data['tracking'][0]['status'] ?? 'unknown',
                    'data'    => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not fetch status',
            ];
        } catch (\Exception $e) {
            Log::error('RedX status check failed', [
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
     * RedX does not provide a simple prepaid balance endpoint in their
     * standard merchant API. We return a friendly "not supported" response
     * the same way PathaoService does, rather than failing silently.
     */
    public function getBalance(): array
    {
        return [
            'success' => false,
            'message' => 'RedX does not provide a balance check via API.',
        ];
    }

    /**
     * Map RedX delivery status to our internal status
     * RedX uses different status strings than our system
     */
    public function mapStatus(string $redxStatus): string
    {
        return match (strtolower($redxStatus)) {
            'delivered'                                => 'delivered',
            'partial-delivered'                        => 'delivered',
            'cancelled'                                => 'cancelled',
            'pickup-pending', 'picked',
            'in-transit', 'received-warehouse',
            'in-review'                                 => 'in_transit',
            'pending'                                   => 'pending',
            'returned', 'partial-returned', 'return-pending' => 'returned',
            default                                     => 'pending',
        };
    }

    /**
     * Build the parcel_details_json array RedX expects.
     * Unlike Pathao/SteadFast which take a plain text description, RedX wants
     * an array of item objects: [{ name, category, value }, ...].
     */
    private function buildParcelDetails($order): array
    {
        if (!$order->items || $order->items->isEmpty()) {
            return [[
                'name'     => 'Goods',
                'category' => 'general',
                'value'    => (float) $order->total_amount,
            ]];
        }

        return $order->items
            ->map(fn($item) => [
                'name'     => ($item->variant->product->name ?? 'Item')
                    . ' x' . $item->quantity,
                'category' => 'general',
                'value'    => (float) ($item->subtotal ?? 0),
            ])
            ->values()
            ->all();
    }
}
