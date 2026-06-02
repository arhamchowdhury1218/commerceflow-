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

    // POST /api/orders
    public function store(Request $request)
    {
        $request->validate([
            'customer_id'              => 'required|exists:customers,id',
            'items'                    => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity'         => 'required|integer|min:1',
            'delivery_charge'          => 'nullable|numeric|min:0',
            'discount'                 => 'nullable|numeric|min:0',
            'payment_method'           => 'nullable|string',
            'payment_status'           => 'nullable|string',
            'courier_name'             => 'nullable|string',
            'source_channel'           => 'nullable|string',
            'notes'                    => 'nullable|string',
            'is_preorder'              => 'boolean',
        ]);

        $businessId = $request->user()->business->id;

        // DB::transaction ensures ALL database operations succeed or ALL fail
        // If inventory update fails, the order is NOT created
        // This prevents inconsistent data
        $order = DB::transaction(function () use ($request, $businessId) {

            $subtotal = 0;

            // Calculate subtotal from all items
            foreach ($request->items as $item) {
                $variant   = \App\Models\ProductVariant::find($item['product_variant_id']);
                $unitPrice = $variant->price ?? $variant->product->base_price;
                $subtotal += $unitPrice * $item['quantity'];
            }

            $deliveryCharge = $request->delivery_charge ?? 0;
            $discount       = $request->discount ?? 0;
            $totalAmount    = $subtotal + $deliveryCharge - $discount;

            // Create the order
            $order = Order::create([
                'business_id'    => $businessId,
                'customer_id'    => $request->customer_id,
                'is_preorder'    => $request->is_preorder ?? false,
                'subtotal'       => $subtotal,
                'discount'       => $discount,
                'delivery_charge' => $deliveryCharge,
                'total_amount'   => $totalAmount,
                'order_status'   => 'pending',
                'payment_status' => $request->payment_status ?? 'unpaid',
                'payment_method' => $request->payment_method,
                'courier_name'   => $request->courier_name,
                'source_channel' => $request->source_channel,
                'notes'          => $request->notes,
            ]);

            // Create order items and deduct inventory
            foreach ($request->items as $item) {
                $variant   = \App\Models\ProductVariant::find($item['product_variant_id']);
                $unitPrice = $variant->price ?? $variant->product->base_price;
                $subtotalItem = $unitPrice * $item['quantity'];

                OrderItem::create([
                    'order_id'           => $order->id,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity'           => $item['quantity'],
                    'unit_price'         => $unitPrice,
                    'subtotal'           => $subtotalItem,
                ]);

                // Deduct stock — only if NOT a pre-order
                if (!$order->is_preorder) {
                    Inventory::where('product_variant_id', $item['product_variant_id'])
                        ->decrement('quantity', $item['quantity']);
                    // decrement() subtracts the quantity atomically
                    // safer than read-then-write in concurrent situations
                }
            }

            return $order;
        });

        return response()->json(
            $order->load(['customer', 'items.variant.product']),
            201
        );
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

        // ── SYNC DELIVERY STATUS ───────────────────────────────────────────
        // When order status changes, also update the delivery record
        // so the Deliveries page stays in sync
        $delivery = $order->delivery;

        if ($delivery) {
            $deliveryStatusMap = [
                'shipped'   => 'pending',
                // shipped = SteadFast has it, pending pickup
                'delivered' => 'delivered',
                'returned'  => 'returned',
                'cancelled' => 'cancelled',
            ];

            if (isset($deliveryStatusMap[$request->order_status])) {
                $delivery->update([
                    'delivery_status' => $deliveryStatusMap[$request->order_status],
                    // If marking delivered, set the delivered_at timestamp
                    'delivered_at' => $request->order_status === 'delivered'
                        ? now()
                        : $delivery->delivered_at,
                ]);
            }
        }
        // ── END SYNC ───────────────────────────────────────────────────────

        // Send email notification
        $order->load('customer');
        $notificationService = new \App\Services\NotificationService();
        $notificationService->sendOrderEmail($order, $request->order_status);

        return response()->json($order);
    }

    // PATCH /api/orders/{id}/payment
    public function updatePayment(Request $request, Order $order)
    {
        if ($order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'payment_status' => 'required|in:unpaid,partial,paid',
            'payment_method' => 'nullable|string',
        ]);

        $order->update([
            'payment_status' => $request->payment_status,
            'payment_method' => $request->payment_method,
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
