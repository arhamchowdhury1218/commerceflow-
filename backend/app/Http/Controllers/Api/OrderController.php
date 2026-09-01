<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

class OrderController extends Controller
{
    // GET /api/orders
    public function index(Request $request)
    {
        $businessId = $request->user()->business->id;

        $orders = Order::where('business_id', $businessId)
            ->with(['customer', 'items.variant.product'])
            ->latest()
            ->paginate(20);
        // paginate(20) returns 20 orders per page
        // React can request page 2 with /api/orders?page=2

        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id'                       => 'required|exists:customers,id',
            'items'                             => 'required|array|min:1',
            'items.*.product_variant_id'        => 'required|exists:product_variants,id',
            'items.*.quantity'                  => 'required|integer|min:1',
            'items.*.unit_price'                => 'required|numeric|min:0',
            'items.*.subtotal'                  => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request) {

            // ── STOCK VALIDATION BEFORE ANYTHING ──────────────────────────────
            // Check every item has enough stock before creating the order
            // This prevents the UNSIGNED integer SQL error from going negative
            // Runs BEFORE any database writes so nothing is saved if stock fails
            foreach ($request->items as $item) {

                // Skip stock check for pre-orders entirely
                if ($request->is_preorder) continue;

                $variantId = $item['product_variant_id'];
                // ↑ frontend sends product_variant_id — match that here

                $variant   = \App\Models\ProductVariant::with('inventory', 'product')
                    ->find($variantId);
                $inventory = $variant?->inventory;

                $available = $inventory?->quantity ?? 0;
                $requested = (int) $item['quantity'];

                if ($requested > $available) {
                    $productName  = $variant?->product?->name ?? 'Product';
                    $variantLabel = implode(' / ', array_filter([
                        $variant?->color,
                        $variant?->size,
                    ])) ?: 'Default';

                    // Throw friendly message — never expose SQL to seller
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => [
                            $available === 0
                                ? "{$productName} ({$variantLabel}) is out of stock. Please remove it from the order."
                                : "Only {$available} left in stock for {$productName} ({$variantLabel}). You tried to order {$requested}."
                        ]
                    ]);
                }
            }

            // ── CREATE ORDER ───────────────────────────────────────────────────
            $businessId = $request->user()->business->id;

            // Calculate totals from items if not passed from frontend
            $subtotal = collect($request->items)
                ->sum(fn($i) => $i['unit_price'] * $i['quantity']);

            $discount      = (float) ($request->discount       ?? 0);
            $deliveryCharge = (float) ($request->delivery_charge ?? 0);
            $totalAmount   = $subtotal + $deliveryCharge - $discount;

            $order = Order::create([
                'business_id'       => $businessId,
                'customer_id'       => $request->customer_id,
                'order_status'      => 'pending',
                'payment_status'    => $request->payment_status  ?? 'unpaid',
                'payment_method'    => $request->payment_method  ?? null,
                'payment_reference' => $request->payment_reference ?? null,   // ← add
                'courier_name'      => $request->courier_name    ?? null,
                'source_channel'    => $request->source_channel  ?? null,
                'subtotal'          => $subtotal,
                'discount'          => $discount,
                'delivery_charge'   => $deliveryCharge,
                'total_amount'      => $totalAmount,
                'paid_amount'       => (float) ($request->paid_amount ?? 0),  // ← add
                'notes'             => $request->notes           ?? null,
                'is_preorder'       => $request->is_preorder     ?? false,
            ]);

            // ── CREATE ITEMS + DEDUCT STOCK ────────────────────────────────────
            foreach ($request->items as $item) {
                $variantId = $item['product_variant_id'];

                $order->items()->create([
                    'product_variant_id' => $variantId,
                    'quantity'           => $item['quantity'],
                    'unit_price'         => $item['unit_price'],
                    'subtotal'           => $item['unit_price'] * $item['quantity'],
                ]);

                // Only deduct stock for real orders — pre-orders skip this
                if (!$request->is_preorder) {
                    // Safe to decrement now — stock was validated above
                    // Stock will never go negative because of the check above
                    Inventory::where('product_variant_id', $variantId)
                        ->decrement('quantity', $item['quantity']);
                }
            }

            return response()->json(
                $order->load(['customer', 'items.variant.product']),
                201
            );
        });
    }

    // GET /api/orders/{id}
    public function show(Request $request, Order $order)
    {
        if ($order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json(
            $order->load(['customer', 'items.variant.product', 'delivery', 'payment'])
        );
    }

    // PUT /api/orders/{id}
    public function update(Request $request, Order $order)
    {
        if ($order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $order->update($request->only([
            'notes',
            'courier_name',
            'source_channel'
        ]));

        return response()->json($order->load(['customer', 'items.variant.product']));
    }

    // PATCH /api/orders/{id}/status
    public function updateStatus(Request $request, Order $order)
    {
        if ($order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'order_status' => 'required|in:pending,confirmed,packed,shipped,delivered,returned,cancelled',
        ]);

        $order->update(['order_status' => $request->order_status]);

        // Sync delivery status
        $delivery = $order->delivery;
        if ($delivery) {
            $deliveryStatusMap = [
                'shipped'   => 'pending',
                'delivered' => 'delivered',
                'returned'  => 'returned',
                'cancelled' => 'cancelled',
            ];
            if (isset($deliveryStatusMap[$request->order_status])) {
                $delivery->update([
                    'delivery_status' => $deliveryStatusMap[$request->order_status],
                    'delivered_at'    => $request->order_status === 'delivered'
                        ? now() : $delivery->delivered_at,
                ]);
            }
        }

        // Send email notification
        try {
            $order->load('customer');

            \Log::info('Attempting to send email', [
                'order_id'      => $order->id,
                'status'        => $request->order_status,
                'customer_email' => $order->customer?->email,
                'mail_host'     => config('mail.mailers.smtp.host'),
                'mail_port'     => config('mail.mailers.smtp.port'),
                'mail_username' => config('mail.mailers.smtp.username'),
                'mail_from'     => config('mail.from.address'),
            ]);

            $notificationService = new \App\Services\NotificationService();
            $notificationService->sendOrderEmail($order, $request->order_status);

            \Log::info('Email sent successfully', [
                'order_id' => $order->id,
                'status'   => $request->order_status,
            ]);
        } catch (\Exception $e) {
            \Log::error('Email send failed in updateStatus', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);
        }

        return response()->json($order);
    }

    // PATCH /api/orders/{id}/payment
    public function updatePayment(Request $request, Order $order)
    {
        if ($order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'payment_status'    => 'required|in:unpaid,partial,paid',
            'payment_method'    => 'nullable|string',
            'payment_reference' => 'nullable|string|max:191',
            'paid_amount'       => 'nullable|numeric|min:0',
        ]);

        // Work out how much has been paid.
        // If the seller marked it fully paid but didn't type an amount,
        // assume the whole order total was paid — saves them a step.
        $paidAmount = $request->paid_amount;
        if ($paidAmount === null) {
            $paidAmount = match ($request->payment_status) {
                'paid'   => $order->total_amount,
                'unpaid' => 0,
                default  => $order->paid_amount, // partial → keep existing
            };
        }

        $order->update([
            'payment_status'    => $request->payment_status,
            'payment_method'    => $request->payment_method,
            'payment_reference' => $request->payment_reference,
            'paid_amount'       => $paidAmount,
        ]);

        return response()->json($order);
    }

    // DELETE /api/orders/{id}
    public function destroy(Request $request, Order $order)
    {
        if ($order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $order->delete();

        return response()->json(['message' => 'Order deleted']);
    }
}
