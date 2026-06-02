import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge, {
  orderStatusConfig,
  paymentStatusConfig,
} from "./StatusBadge";

export default function OrdersTable({ orders, onViewOrder }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 md:pl-6">Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden sm:table-cell">Amount</TableHead>
            <TableHead className="hidden md:table-cell">Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Courier</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="pr-4 md:pr-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, i) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-border last:border-0
                         hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => onViewOrder(order)}
            >
              <TableCell className="pl-4 md:pl-6">
                <span
                  className="font-mono text-xs font-medium
                                text-muted-foreground"
                >
                  #CF-{String(order.id).padStart(4, "0")}
                </span>
              </TableCell>

              <TableCell>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {order.customer?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer?.phone}
                  </p>
                </div>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <span className="text-sm font-semibold tabular-nums">
                  ৳{Number(order.total_amount).toLocaleString()}
                </span>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <StatusBadge
                  status={order.payment_status}
                  config={paymentStatusConfig}
                />
              </TableCell>

              <TableCell>
                <StatusBadge
                  status={order.order_status}
                  config={orderStatusConfig}
                />
              </TableCell>

              <TableCell
                className="hidden lg:table-cell text-xs
                                   text-muted-foreground capitalize"
              >
                {order.courier_name || "—"}
              </TableCell>

              <TableCell
                className="hidden md:table-cell text-xs
                                   text-muted-foreground"
              >
                {new Date(order.created_at).toLocaleDateString("en-BD")}
              </TableCell>

              <TableCell
                className="pr-4 md:pr-6"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onViewOrder(order)}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
