import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ShoppingCart,
  Banknote,
  Users,
  RotateCcw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import useAnalytics from "@/hooks/useAnalytics";

// Colors for pie chart slices
const PIE_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

// Stat card with trend comparison vs last month
function SummaryCard({
  label,
  value,
  subValue,
  subLabel,
  trend,
  icon: Icon,
  iconBg,
  iconColor,
  index,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.07 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className={`p-2 rounded-xl ${iconBg}`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold tracking-tight">
            {value}
          </p>
          {subValue !== undefined && (
            <div
              className={`flex items-center gap-1 mt-1.5 text-xs font-medium
              ${
                trend === "up"
                  ? "text-green-600 dark:text-green-400"
                  : trend === "down"
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            >
              {trend === "up" && <TrendingUp className="w-3 h-3" />}
              {trend === "down" && <TrendingDown className="w-3 h-3" />}
              <span>
                {subLabel}: {subValue}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Custom tooltip for revenue chart
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold">
        Revenue: {Number(payload[0]?.value || 0).toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground">
        Orders: {payload[1]?.value || 0}
      </p>
    </div>
  );
}

export default function Analytics() {
  const { data, loading } = useAnalytics();

  if (loading) return <LoadingSpinner text="Loading analytics..." />;
  if (!data) return null;

  const {
    summary,
    revenue_by_day,
    status_breakdown,
    payment_breakdown,
    top_products,
    top_customers,
    source_breakdown,
  } = data;

  // Build trend comparison vs last month
  const orderTrend =
    summary.last_month_orders > 0
      ? summary.this_month_orders >= summary.last_month_orders
        ? "up"
        : "down"
      : "neutral";

  const revenueTrend =
    summary.last_month_revenue > 0
      ? summary.this_month_revenue >= summary.last_month_revenue
        ? "up"
        : "down"
      : "neutral";

  // Format status breakdown for pie chart
  const statusChartData = Object.entries(status_breakdown || {}).map(
    ([name, value]) => ({ name, value }),
  );

  // Format payment breakdown for pie chart
  const paymentChartData = (payment_breakdown || []).map((item) => ({
    name: item.payment_method?.replace("_", " ") || "Unknown",
    value: item.count,
  }));

  // Format source breakdown for pie chart
  const sourceChartData = (source_breakdown || []).map((item) => ({
    name: item.source_channel || "Unknown",
    value: item.count,
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Analytics"
        description="Business performance overview"
      />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard
          index={0}
          label="This Month Orders"
          value={summary.this_month_orders}
          subValue={summary.last_month_orders}
          subLabel="Last month"
          trend={orderTrend}
          icon={ShoppingCart}
          iconBg="bg-blue-50 dark:bg-blue-950"
          iconColor="text-blue-500"
        />
        <SummaryCard
          index={1}
          label="This Month Revenue"
          value={`${Number(summary.this_month_revenue).toLocaleString()}`}
          subValue={`${Number(summary.last_month_revenue).toLocaleString()}`}
          subLabel="Last month"
          trend={revenueTrend}
          icon={Banknote}
          iconBg="bg-green-50 dark:bg-green-950"
          iconColor="text-green-500"
        />
        <SummaryCard
          index={2}
          label="Total Customers"
          value={summary.total_customers}
          subValue={summary.total_orders}
          subLabel="Total orders"
          trend="neutral"
          icon={Users}
          iconBg="bg-purple-50 dark:bg-purple-950"
          iconColor="text-purple-500"
        />
        <SummaryCard
          index={3}
          label="Return Rate"
          value={`${summary.return_rate}%`}
          subValue={`${Number(summary.total_revenue).toLocaleString()}`}
          subLabel="All-time revenue"
          trend={summary.return_rate < 5 ? "up" : "down"}
          icon={RotateCcw}
          iconBg="bg-amber-50 dark:bg-amber-950"
          iconColor="text-amber-500"
        />
      </div>

      {/* REVENUE CHART — last 30 days */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base font-semibold">
              Revenue — Last 30 Days
            </CardTitle>
            <CardDescription className="text-xs">
              Daily revenue from paid orders
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pr-2">
            {revenue_by_day.length === 0 ? (
              <div
                className="flex items-center justify-center h-48
                              text-sm text-muted-foreground"
              >
                No revenue data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={revenue_by_day}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(d) => d?.slice(5)}
                    // Slice year: "2025-01-15" → "01-15"
                  />
                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* PIE CHARTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Order status breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusChartData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 11 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment method breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentChartData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentChartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 11 }} className="capitalize">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Source channel breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Order Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceChartData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={sourceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sourceChartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 11 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* TOP PRODUCTS + TOP CUSTOMERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Top Products
              </CardTitle>
              <CardDescription className="text-xs">
                Most ordered products all time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {top_products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No orders yet
                </p>
              ) : (
                top_products.map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank number */}
                      <div
                        className="w-6 h-6 rounded-full bg-primary/10
                                    flex items-center justify-center
                                    text-xs font-bold text-primary flex-shrink-0"
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product.name}
                        </p>
                        {product.variant && (
                          <p className="text-xs text-muted-foreground">
                            {product.variant}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tabular-nums">
                        {product.total_qty} sold
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {Number(product.total_revenue).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.55 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Top Customers
              </CardTitle>
              <CardDescription className="text-xs">
                Customers with most orders all time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {top_customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No orders yet
                </p>
              ) : (
                top_customers.map((customer, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with initial */}
                      <div
                        className="w-7 h-7 rounded-full bg-primary/10
                                    flex items-center justify-center
                                    text-xs font-bold text-primary flex-shrink-0"
                      >
                        {customer.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tabular-nums">
                        {customer.total_orders} orders
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {Number(customer.total_spent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
