import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-purple-500",
];

export default function WeekSummary({ stats }) {
  return (
    <motion.div
      className="lg:col-span-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.38 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm md:text-base font-semibold">
            This Week
          </CardTitle>
          <CardDescription className="text-xs">
            Performance summary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {stats.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-0.5"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0
                  ${COLORS[i % COLORS.length]}`}
                />
                <span className="text-xs md:text-sm text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <span className="text-xs md:text-sm font-semibold tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
