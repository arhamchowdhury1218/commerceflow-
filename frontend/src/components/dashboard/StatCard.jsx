import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ stat, index }) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <div className={`p-2 rounded-xl ${stat.iconBg}`}>
              <Icon className={`w-4 h-4 ${stat.iconColor}`} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-xl md:text-2xl font-bold tracking-tight">
              {stat.value}
            </p>
            <div
              className={`flex items-center gap-1 text-xs font-medium
              ${
                stat.trend === "up"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500"
              }`}
            >
              {stat.trend === "up" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{stat.change}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
