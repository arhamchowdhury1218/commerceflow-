<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    // GET /api/dashboard
    public function index(Request $request)
    {
        $businessId = $request->user()->business->id ?? null;

        if (!$businessId) {
            return response()->json(['error' => 'No business found'], 404);
        }

        $today     = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();

        // Today's order count
        $todayOrders = Order::where('business_id', $businessId)
            ->whereDate('created_at', $today)
            ->count();

        // Today's revenue from paid orders
        $todayRevenue = Order::where('business_id', $businessId)
            ->whereDate('created_at', $today)
            ->where('payment_status', 'paid')
            ->sum('total_amount');

        // Orders currently shipped but not delivered
        $pendingDeliveries = Order::where('business_id', $businessId)
            ->where('order_status', 'shipped')
            ->count();

        // Weekly chart data — sales per day
        $weeklySales = Order::where('business_id', $businessId)
            ->where('created_at', '>=', $weekStart)
            ->select(
                DB::raw('DAYNAME(created_at) as day'),
                DB::raw('SUM(total_amount) as sales')
            )
            ->groupBy('day', DB::raw('DATE(created_at)'))
            ->orderBy(DB::raw('DATE(created_at)'))
            ->get();

        // Recent 5 orders with customer and product info
        $recentOrders = Order::where('business_id', $businessId)
            ->with(['customer', 'items.variant.product'])
            // with() = eager loading prevents N+1 query problem
            ->latest()
            ->limit(5)
            ->get();

        // Return rate calculation
        $totalOrders    = Order::where('business_id', $businessId)->count();
        $returnedOrders = Order::where('business_id', $businessId)
            ->where('order_status', 'returned')
            ->count();

        $returnRate = $totalOrders > 0
            ? round(($returnedOrders / $totalOrders) * 100, 1)
            : 0;

        // Weekly summary numbers
        $weeklyStats = [
            'total_orders'     => Order::where('business_id', $businessId)->where('created_at', '>=', $weekStart)->count(),
            'revenue'          => Order::where('business_id', $businessId)->where('created_at', '>=', $weekStart)->sum('total_amount'),
            'delivered'        => Order::where('business_id', $businessId)->where('created_at', '>=', $weekStart)->where('order_status', 'delivered')->count(),
            'pending'          => Order::where('business_id', $businessId)->where('created_at', '>=', $weekStart)->where('order_status', 'pending')->count(),
            'returned'         => Order::where('business_id', $businessId)->where('created_at', '>=', $weekStart)->where('order_status', 'returned')->count(),
        ];

        return response()->json([
            'stats' => [
                'today_orders'       => $todayOrders,
                'today_revenue'      => $todayRevenue,
                'pending_deliveries' => $pendingDeliveries,
                'return_rate'        => $returnRate,
            ],
            'weekly_stats'  => $weeklyStats,
            'chart'         => $weeklySales,
            'recent_orders' => $recentOrders,
        ]);
    }
}
