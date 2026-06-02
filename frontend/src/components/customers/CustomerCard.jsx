import { motion } from "framer-motion";
import { Phone, Mail, MapPin, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CustomerCard({ customer, index, onDelete, onView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card
        className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={() => onView(customer)}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Avatar + Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-full bg-primary/10 flex
                              items-center justify-center flex-shrink-0"
              >
                <span className="text-sm font-semibold text-primary">
                  {customer.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {customer.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {customer.source_channel || "manual"}
                </p>
              </div>
            </div>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground
                         hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(customer.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Contact info */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {customer.phone}
              </span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {customer.email}
                </span>
              </div>
            )}
            {customer.delivery_address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {customer.delivery_address}
                </span>
              </div>
            )}
          </div>

          {/* Order count */}
          {customer.orders_count > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {customer.orders_count} order
                {customer.orders_count !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
