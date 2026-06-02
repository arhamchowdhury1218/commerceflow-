import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-card border border-border rounded-lg
                    px-3 py-2 shadow-lg"
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold">৳{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function WeeklyChart({ data }) {
  return (
    <motion.div
      className="lg:col-span-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.32 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm md:text-base font-semibold">
            Weekly Sales
          </CardTitle>
          <CardDescription className="text-xs">
            Revenue for the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-0 pr-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={42}
                tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "hsl(var(--accent))", opacity: 0.5 }}
              />
              <Bar
                dataKey="sales"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
