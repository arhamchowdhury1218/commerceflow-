<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Delivery;
use App\Services\SteadFastService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    private SteadFastService $steadfast;

    public function __construct(SteadFastService $steadfast)
    {
        $this->steadfast = $steadfast;
    }

    // GET /api/deliveries
    // Returns all orders that have a delivery record
    public function index(Request $request)
    {
        $businessId = $request->user()->business->id;

        $deliveries = Delivery::whereHas('order', function ($q) use ($businessId) {
            $q->where('business_id', $businessId);
        })
            ->with([
                'order.customer',
                'order.items.variant.product',
            ])
            ->latest()
            ->get();

        return response()->json($deliveries);
    }

    // POST /api/deliveries/book/{order}
    public function book(Request $request, Order $order)
    {
        if ($order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($order->delivery && $order->delivery->consignment_id) {
            return response()->json([
                'error'    => 'This order already has a consignment booked.',
                'delivery' => $order->delivery,
            ], 422);
        }

        $order->load(['customer', 'items.variant.product']);
        $result = $this->steadfast->createConsignment($order);

        if (!$result['success']) {
            return response()->json([
                'error'   => 'SteadFast booking failed',
                'message' => $result['message'],
            ], 422);
        }

        $delivery = Delivery::updateOrCreate(
            ['order_id' => $order->id],
            [
                'courier_name'     => 'steadfast',
                'consignment_id'   => $result['consignment_id'],
                'tracking_number'  => $result['tracking_code'],
                'delivery_status'  => 'pending',
                'delivery_address' => $order->customer->delivery_address,
                'shipped_at'       => now(),
            ]
        );

        $order->update(['order_status' => 'shipped']);

        // Send shipped email with tracking number
        $notificationService = new NotificationService();
        $order->load('customer');
        $notificationService->sendOrderEmail($order, 'shipped', [
            'tracking_code' => $result['tracking_code'],
        ]);

        return response()->json([
            'message'        => 'Consignment booked successfully',
            'tracking_code'  => $result['tracking_code'],
            'consignment_id' => $result['consignment_id'],
            'delivery'       => $delivery,
        ]);
    }

    // POST /api/deliveries/sync/{delivery}
    // Syncs latest status from SteadFast API
    public function sync(Request $request, Delivery $delivery)
    {
        // Make sure this delivery belongs to the seller
        if ($delivery->order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (!$delivery->consignment_id) {
            return response()->json(['error' => 'No consignment ID found'], 422);
        }

        $result = $this->steadfast->getStatusByConsignmentId(
            $delivery->consignment_id
        );

        if (!$result['success']) {
            return response()->json([
                'error'   => 'Could not sync status',
                'message' => $result['message'],
            ], 422);
        }

        $newStatus = $this->steadfast->mapStatus($result['status']);
        $delivery->update(['delivery_status' => $newStatus]);

        // Update order status based on delivery status
        if ($newStatus === 'delivered') {
            $delivery->order->update(['order_status' => 'delivered']);
            // Send delivered email
            $notificationService = new NotificationService();
            $delivery->order->load('customer');
            $notificationService->sendOrderEmail($delivery->order, 'delivered');
        }

        if ($newStatus === 'returned') {
            $delivery->order->update(['order_status' => 'returned']);
            $notificationService = new NotificationService();
            $delivery->order->load('customer');
            $notificationService->sendOrderEmail($delivery->order, 'returned');
        }

        return response()->json([
            'message'          => 'Status synced successfully',
            'steadfast_status' => $result['status'],
            'our_status'       => $newStatus,
            'delivery'         => $delivery->fresh()->load('order.customer'),
        ]);
    }

    // POST /api/deliveries/sync-all
    // Syncs all pending/in-transit deliveries at once
    public function syncAll(Request $request)
    {
        $businessId = $request->user()->business->id;

        // Get all deliveries that are not yet completed
        $deliveries = Delivery::whereHas('order', function ($q) use ($businessId) {
            $q->where('business_id', $businessId);
        })
            ->whereNotIn('delivery_status', ['delivered', 'returned', 'cancelled'])
            ->whereNotNull('consignment_id')
            ->get();

        $updated = 0;

        foreach ($deliveries as $delivery) {
            $result = $this->steadfast->getStatusByConsignmentId(
                $delivery->consignment_id
            );

            if ($result['success']) {
                $newStatus = $this->steadfast->mapStatus($result['status']);
                $delivery->update(['delivery_status' => $newStatus]);
                $updated++;
            }
        }

        return response()->json([
            'message' => "Synced {$updated} deliveries",
            'updated' => $updated,
        ]);
    }

    // GET /api/deliveries/balance
    public function balance(Request $request)
    {
        $result = $this->steadfast->getBalance();
        return response()->json($result);
    }
}
