<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    // GET /api/analytics
    public function index(Request $request)
    {
        $businessId = $request->user()->business->id;

        // Date ranges
        $now        = Carbon::now();
        $monthStart = Carbon::now()->startOfMonth();
        $lastMonth  = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        // ── SUMMARY STATS ─────────────────────────────────────────────────

        // This month
        $thisMonthOrders  = Order::where('business_id', $businessId)
            ->where('created_at', '>=', $monthStart)->count();

        $thisMonthRevenue = Order::where('business_id', $businessId)
            ->where('created_at', '>=', $monthStart)
            ->where('payment_status', 'paid')
            ->sum('total_amount');

        // Last month for comparison
        $lastMonthOrders  = Order::where('business_id', $businessId)
            ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])
            ->count();

        $lastMonthRevenue = Order::where('business_id', $businessId)
            ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])
            ->where('payment_status', 'paid')
            ->sum('total_amount');

        // All time
        $totalOrders    = Order::where('business_id', $businessId)->count();
        $totalRevenue   = Order::where('business_id', $businessId)
            ->where('payment_status', 'paid')->sum('total_amount');
        $totalCustomers = Customer::where('business_id', $businessId)->count();

        // Return rate
        $returnedOrders = Order::where('business_id', $businessId)
            ->where('order_status', 'returned')->count();
        $returnRate = $totalOrders > 0
            ? round(($returnedOrders / $totalOrders) * 100, 1) : 0;

        // ── REVENUE LAST 30 DAYS ──────────────────────────────────────────

        $revenueByDay = Order::where('business_id', $businessId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->where('payment_status', 'paid')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // ── ORDER STATUS BREAKDOWN ────────────────────────────────────────

        $statusBreakdown = Order::where('business_id', $businessId)
            ->select('order_status', DB::raw('COUNT(*) as count'))
            ->groupBy('order_status')
            ->get()
            ->mapWithKeys(fn($item) => [
                $item->order_status => $item->count
            ]);

        // ── PAYMENT METHOD BREAKDOWN ──────────────────────────────────────

        $paymentBreakdown = Order::where('business_id', $businessId)
            ->whereNotNull('payment_method')
            ->select('payment_method', DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();

        // ── TOP 5 PRODUCTS ────────────────────────────────────────────────

        $topProducts = OrderItem::whereHas('order', function ($q) use ($businessId) {
            $q->where('business_id', $businessId);
        })
            ->select(
                'product_variant_id',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(subtotal) as total_revenue')
            )
            ->groupBy('product_variant_id')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->with('variant.product')
            ->get()
            ->map(fn($item) => [
                'name'    => $item->variant->product->name ?? 'Unknown',
                'variant' => implode(' ', array_filter([
                    $item->variant->color,
                    $item->variant->size,
                ])),
                'total_qty'     => $item->total_qty,
                'total_revenue' => $item->total_revenue,
            ]);

        // ── TOP 5 CUSTOMERS ───────────────────────────────────────────────

        $topCustomers = Order::where('business_id', $businessId)
            ->select(
                'customer_id',
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_spent')
            )
            ->groupBy('customer_id')
            ->orderByDesc('total_orders')
            ->limit(5)
            ->with('customer')
            ->get()
            ->map(fn($item) => [
                'name'         => $item->customer->name ?? 'Unknown',
                'phone'        => $item->customer->phone ?? '',
                'total_orders' => $item->total_orders,
                'total_spent'  => $item->total_spent,
            ]);

        // ── SOURCE CHANNEL BREAKDOWN ──────────────────────────────────────

        $sourceBreakdown = Order::where('business_id', $businessId)
            ->whereNotNull('source_channel')
            ->select('source_channel', DB::raw('COUNT(*) as count'))
            ->groupBy('source_channel')
            ->get();

        return response()->json([
            'summary' => [
                'this_month_orders'   => $thisMonthOrders,
                'this_month_revenue'  => $thisMonthRevenue,
                'last_month_orders'   => $lastMonthOrders,
                'last_month_revenue'  => $lastMonthRevenue,
                'total_orders'        => $totalOrders,
                'total_revenue'       => $totalRevenue,
                'total_customers'     => $totalCustomers,
                'return_rate'         => $returnRate,
            ],
            'revenue_by_day'    => $revenueByDay,
            'status_breakdown'  => $statusBreakdown,
            'payment_breakdown' => $paymentBreakdown,
            'source_breakdown'  => $sourceBreakdown,
            'top_products'      => $topProducts,
            'top_customers'     => $topCustomers,
        ]);
    }
}
