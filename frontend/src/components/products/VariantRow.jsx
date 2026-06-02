import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// One variant row inside AddProductModal
// Props: variant data, index, onChange handler, onRemove handler

export default function VariantRow({
  variant,
  index,
  onChange,
  onRemove,
  canRemove,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl p-4 space-y-3 bg-muted/20"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Variant {index + 1}
        </p>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Color
          </label>
          <Input
            placeholder="Red, Blue..."
            value={variant.color}
            onChange={(e) => onChange(index, "color", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Size
          </label>
          <Input
            placeholder="S, M, L, XL..."
            value={variant.size}
            onChange={(e) => onChange(index, "size", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Price (৳) — optional
          </label>
          <Input
            type="number"
            min="0"
            placeholder="Uses base price"
            value={variant.price}
            onChange={(e) => onChange(index, "price", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Stock <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={variant.quantity}
            onChange={(e) => onChange(index, "quantity", e.target.value)}
            className="h-8 text-sm"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Low Stock Alert Threshold
        </label>
        <Input
          type="number"
          min="1"
          value={variant.low_stock_threshold}
          onChange={(e) =>
            onChange(index, "low_stock_threshold", e.target.value)
          }
          className="h-8 text-sm w-28"
        />
      </div>
    </motion.div>
  );
}
