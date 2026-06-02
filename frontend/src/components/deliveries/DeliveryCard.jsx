import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Copy, Check, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeliveryStatusBadge from "./DeliveryStatusBadge";

export default function DeliveryCard({ delivery, index, onSync }) {
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const order = delivery.order;
  const customer = order?.customer;

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    const result = await onSync(delivery.id);
    setSyncMsg(
      result.success
        ? `Updated to: ${result.data?.our_status || "synced"}`
        : result.message,
    );
    setSyncing(false);
    // Clear message after 3 seconds
    setTimeout(() => setSyncMsg(null), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(delivery.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Only show sync button for active deliveries
  const isActive = !["delivered", "returned", "cancelled"].includes(
    delivery.delivery_status,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Left — order + customer info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-mono text-xs font-semibold
                                 text-muted-foreground"
                >
                  #CF-{String(order?.id).padStart(4, "0")}
                </span>
                <DeliveryStatusBadge status={delivery.delivery_status} />
                {delivery.delivery_status === "delivered" && (
                  <span className="text-xs text-green-600 font-medium">✓</span>
                )}
              </div>

              <p className="text-sm font-semibold mt-1.5">{customer?.name}</p>
              <p className="text-xs text-muted-foreground">{customer?.phone}</p>
              {delivery.delivery_address && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {delivery.delivery_address}
                </p>
              )}
            </div>

            {/* Right — amount */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold tabular-nums">
                ৳{Number(order?.total_amount || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {order?.payment_status}
              </p>
            </div>
          </div>

          {/* Tracking number */}
          {delivery.tracking_number && (
            <div
              className="mt-3 flex items-center gap-2 bg-muted/40
                            rounded-lg px-3 py-2"
            >
              <Package
                className="w-3.5 h-3.5 text-muted-foreground
                                  flex-shrink-0"
              />
              <span
                className="font-mono text-xs font-semibold flex-1
                               truncate"
              >
                {delivery.tracking_number}
              </span>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground
                           transition-colors flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Consignment ID + shipped date */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {delivery.consignment_id && (
              <span className="text-xs text-muted-foreground">
                Consignment: {delivery.consignment_id}
              </span>
            )}
            {delivery.shipped_at && (
              <span className="text-xs text-muted-foreground">
                Shipped:{" "}
                {new Date(delivery.shipped_at).toLocaleDateString("en-BD")}
              </span>
            )}
          </div>

          {/* Order items preview */}
          {order?.items?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {order.items
                .map((i) => `${i.variant?.product?.name} x${i.quantity}`)
                .join(" · ")}
            </p>
          )}

          {/* Sync button + result message */}
          <div className="mt-3 flex items-center gap-2">
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw
                  className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Syncing..." : "Sync Status"}
              </Button>
            )}

            {syncMsg && (
              <span
                className={`text-xs font-medium ${
                  syncMsg.startsWith("Updated")
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500"
                }`}
              >
                {syncMsg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
