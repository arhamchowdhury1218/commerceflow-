import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge, {
  orderStatusConfig,
  paymentStatusConfig,
} from "@/components/orders/StatusBadge";

export default function RecentOrdersTable({ orders }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.44 }}
    >
      <Card>
        <CardHeader
          className="flex flex-row items-center
                               justify-between pb-3"
        >
          <div>
            <CardTitle className="text-sm md:text-base font-semibold">
              Recent Orders
            </CardTitle>
            <CardDescription className="text-xs">
              Last 5 orders across all channels
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => navigate("/orders")}
          >
            View all <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 md:pl-6">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Product
                  </TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="pr-4 md:pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/40
                               transition-colors"
                    onClick={() => navigate("/orders")}
                  >
                    <TableCell className="pl-4 md:pl-6">
                      <span
                        className="font-mono text-xs font-medium
                                      text-muted-foreground"
                      >
                        #CF-{String(order.id).padStart(4, "0")}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-xs md:text-sm">
                      {order.customer?.name}
                    </TableCell>
                    <TableCell
                      className="hidden sm:table-cell text-xs
                                         text-muted-foreground"
                    >
                      {order.items?.[0]?.variant?.product?.name || "—"}
                    </TableCell>
                    <TableCell
                      className="font-semibold text-xs md:text-sm
                                         tabular-nums"
                    >
                      ৳{Number(order.total_amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="pr-4 md:pr-6">
                      <StatusBadge
                        status={order.order_status}
                        config={orderStatusConfig}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
