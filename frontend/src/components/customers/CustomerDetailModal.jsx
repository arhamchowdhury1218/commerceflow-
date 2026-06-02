import { motion } from "framer-motion";
import { X, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge, {
  orderStatusConfig,
} from "@/components/orders/StatusBadge";

export default function CustomerDetailModal({ customer, onClose }) {
  if (!customer) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center
                 justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-2xl w-full max-w-lg
                   max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5
                        border-b border-border"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-primary/10 flex
                            items-center justify-center"
            >
              <span className="text-sm font-bold text-primary">
                {customer.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-base">{customer.name}</h2>
              <p className="text-xs text-muted-foreground capitalize">
                {customer.source_channel || "manual"} customer
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Contact info */}
          <div>
            <p
              className="text-xs font-medium text-muted-foreground
                          uppercase tracking-wider mb-3"
            >
              Contact
            </p>
            <div className="bg-muted/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm">{customer.email}</span>
                </div>
              )}
              {customer.delivery_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{customer.delivery_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order history */}
          {customer.orders?.length > 0 && (
            <div>
              <p
                className="text-xs font-medium text-muted-foreground
                            uppercase tracking-wider mb-3"
              >
                Order History ({customer.orders.length})
              </p>
              <div className="space-y-2">
                {customer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between
                               bg-muted/40 rounded-lg px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-medium font-mono text-muted-foreground">
                        #CF-{String(order.id).padStart(4, "0")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-BD")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        ৳{Number(order.total_amount).toLocaleString()}
                      </span>
                      <StatusBadge
                        status={order.order_status}
                        config={orderStatusConfig}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!customer.orders || customer.orders.length === 0) && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No orders yet from this customer
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
