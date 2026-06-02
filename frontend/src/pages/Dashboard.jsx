import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Banknote, Truck, RotateCcw } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import WeeklyChart from "@/components/dashboard/WeeklyChart";
import WeekSummary from "@/components/dashboard/WeekSummary";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import api from "@/lib/api";

// Fallback mock chart data shown before real data loads
const EMPTY_CHART = [
  { day: "Sun", sales: 0 },
  { day: "Mon", sales: 0 },
  { day: "Tue", sales: 0 },
  { day: "Wed", sales: 0 },
  { day: "Thu", sales: 0 },
  { day: "Fri", sales: 0 },
  { day: "Sat", sales: 0 },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(EMPTY_CHART);
  const [weekStats, setWeekStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get("/dashboard");
        const data = res.data;

        // Build stat cards from real API response
        setStats([
          {
            label: "Today's orders",
            value: String(data.stats.today_orders),
            change: "vs yesterday",
            trend: "up",
            icon: ShoppingCart,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-50 dark:bg-blue-950",
          },
          {
            label: "Today's revenue",
            value: `৳${Number(data.stats.today_revenue).toLocaleString()}`,
            change: "paid orders",
            trend: "up",
            icon: Banknote,
            iconColor: "text-green-500",
            iconBg: "bg-green-50 dark:bg-green-950",
          },
          {
            label: "Pending delivery",
            value: String(data.stats.pending_deliveries),
            change: "shipped orders",
            trend: data.stats.pending_deliveries > 10 ? "down" : "up",
            icon: Truck,
            iconColor: "text-amber-500",
            iconBg: "bg-amber-50 dark:bg-amber-950",
          },
          {
            label: "Return rate",
            value: `${data.stats.return_rate}%`,
            change: "all time",
            trend: data.stats.return_rate < 5 ? "up" : "down",
            icon: RotateCcw,
            iconColor: "text-purple-500",
            iconBg: "bg-purple-50 dark:bg-purple-950",
          },
        ]);

        // Map chart data from API
        if (data.chart?.length > 0) {
          setChartData(
            data.chart.map((d) => ({
              day: d.day?.slice(0, 3),
              // "Monday" → "Mon"
              sales: Number(d.sales),
            })),
          );
        }

        // Build week summary list
        const ws = data.weekly_stats;
        setWeekStats([
          { label: "Total orders", value: String(ws.total_orders) },
          {
            label: "Revenue",
            value: `৳${Number(ws.revenue).toLocaleString()}`,
          },
          { label: "Delivered", value: String(ws.delivered) },
          { label: "Pending", value: String(ws.pending) },
          { label: "Returned", value: String(ws.returned) },
        ]);

        setRecentOrders(data.recent_orders || []);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here is what is happening with your business today.
        </p>
      </motion.div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      )}

      {/* Chart + Week summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
        <WeeklyChart data={chartData} />
        <WeekSummary stats={weekStats} />
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && <RecentOrdersTable orders={recentOrders} />}
    </div>
  );
}
