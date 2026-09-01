<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Delivery;
use App\Services\SteadFastService;
use App\Services\PathaoService;
use App\Services\RedxService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    private SteadFastService $steadfast;
    private PathaoService $pathao;
    private RedxService $redx;

    public function __construct(
        SteadFastService $steadfast,
        PathaoService $pathao,
        RedxService $redx
    ) {
        $this->steadfast = $steadfast;
        $this->pathao    = $pathao;
        $this->redx      = $redx;
    }

    // ── COURIER RESOLVER ────────────────────────────────────────────────────
    // Every courier service (SteadFastService, PathaoService, RedxService)
    // implements the SAME method names: createConsignment(),
    // getStatusByConsignmentId(), mapStatus(), getBalance().
    // This lets book()/sync()/syncAll() stay courier-agnostic — they just
    // ask "give me the right service for this courier" and call the same
    // methods regardless of which courier it actually is.
    //
    // Adding a 4th courier later only means: write the service class,
    // add one line here. Nothing else in this controller changes.
    private function resolveCourier(?string $courierName)
    {
        return match ($courierName) {
            'pathao' => $this->pathao,
            'redx'   => $this->redx,
            default  => $this->steadfast,
            // 'steadfast' and any legacy/unset value falls back to SteadFast
            // since that was the only courier before this Phase 2 change —
            // existing orders with courier_name='steadfast' keep working
        };
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

        $courierName = $order->courier_name ?: 'steadfast';
        $courier     = $this->resolveCourier($courierName);

        $order->load(['customer', 'items.variant.product']);
        $result = $courier->createConsignment($order);

        if (!$result['success']) {
            return response()->json([
                'error'   => ucfirst($courierName) . ' booking failed',
                'message' => $result['message'],
            ], 422);
        }

        $delivery = Delivery::updateOrCreate(
            ['order_id' => $order->id],
            [
                'courier_name'     => $courierName,
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
            'courier_name'   => $courierName,
            'tracking_code'  => $result['tracking_code'],
            'consignment_id' => $result['consignment_id'],
            'delivery'       => $delivery,
        ]);
    }

    // POST /api/deliveries/sync/{delivery}
    // Syncs latest status from the courier the delivery was booked with
    public function sync(Request $request, Delivery $delivery)
    {
        // Make sure this delivery belongs to the seller
        if ($delivery->order->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (!$delivery->consignment_id) {
            return response()->json(['error' => 'No consignment ID found'], 422);
        }

        $courier = $this->resolveCourier($delivery->courier_name);

        $result = $courier->getStatusByConsignmentId(
            $delivery->consignment_id
        );

        if (!$result['success']) {
            return response()->json([
                'error'   => 'Could not sync status',
                'message' => $result['message'],
            ], 422);
        }

        $newStatus = $courier->mapStatus($result['status']);
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
            'message'        => 'Status synced successfully',
            'courier_status' => $result['status'],
            'our_status'     => $newStatus,
            'delivery'       => $delivery->fresh()->load('order.customer'),
        ]);
    }

    // POST /api/deliveries/sync-all
    // Syncs all pending/in-transit deliveries at once, across all couriers
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
        $failed  = 0;

        foreach ($deliveries as $delivery) {
            $courier = $this->resolveCourier($delivery->courier_name);

            $result = $courier->getStatusByConsignmentId(
                $delivery->consignment_id
            );

            if ($result['success']) {
                $newStatus = $courier->mapStatus($result['status']);
                $delivery->update(['delivery_status' => $newStatus]);
                $updated++;
            } else {
                $failed++;
            }
        }

        return response()->json([
            'message' => "Synced {$updated} deliveries" . ($failed > 0 ? ", {$failed} failed" : ''),
            'updated' => $updated,
            'failed'  => $failed,
        ]);
    }

    // GET /api/deliveries/balance
    // Defaults to SteadFast balance — the only courier with a simple
    // balance-check endpoint. Pathao and RedX return a friendly
    // "not supported" message from their own getBalance() if ever called.
    public function balance(Request $request)
    {
        $result = $this->steadfast->getBalance();
        return response()->json($result);
    }

    // GET /api/deliveries/balance/{courier}
    // Explicit balance check for a specific courier (steadfast|pathao|redx)
    public function balanceFor(Request $request, string $courier)
    {
        $result = $this->resolveCourier($courier)->getBalance();
        return response()->json($result);
    }
}
