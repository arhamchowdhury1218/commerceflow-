import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VariantRow from "./VariantRow";
import api from "@/lib/api";

export default function AddProductModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [product, setProduct] = useState({
    name: "",
    base_price: "",
    description: "",
  });

  const [variants, setVariants] = useState([
    { color: "", size: "", price: "", quantity: "", low_stock_threshold: 5 },
  ]);

  const handleProductChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
    setError("");
  };

  const handleVariantChange = (index, field, value) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { color: "", size: "", price: "", quantity: "", low_stock_threshold: 5 },
    ]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/products", {
        ...product,
        variants: variants.map((v) => ({
          color: v.color || null,
          size: v.size || null,
          price: v.price || null,
          quantity: parseInt(v.quantity) || 0,
          low_stock_threshold: parseInt(v.low_stock_threshold) || 5,
        })),
      });
      onSuccess();
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors)[0][0]
          : err.response?.data?.message || "Failed to create product.",
      );
    } finally {
      setLoading(false);
    }
  };

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
        className="bg-card border border-border rounded-2xl w-full max-w-2xl
                   max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 border-b
                        border-border sticky top-0 bg-card z-10"
        >
          <div>
            <h2 className="font-semibold text-base">Add New Product</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in product details and add variants with stock
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {error && (
            <div
              className="flex items-center gap-2 bg-destructive/10
                            border border-destructive/30 text-destructive
                            rounded-lg px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <p
              className="text-sm font-semibold text-muted-foreground
                          uppercase tracking-wider"
            >
              Product Info
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Product Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Cotton T-Shirt"
                value={product.name}
                onChange={handleProductChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Base Price (৳) <span className="text-destructive">*</span>
              </label>
              <Input
                name="base_price"
                type="number"
                min="0"
                placeholder="500"
                value={product.base_price}
                onChange={handleProductChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Used when variant has no specific price
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Description (optional)
              </label>
              <textarea
                name="description"
                placeholder="Brief product description..."
                value={product.description}
                onChange={handleProductChange}
                rows={2}
                className="w-full text-sm border border-border rounded-md
                           px-3 py-2 bg-background text-foreground
                           focus:outline-none focus:ring-2 focus:ring-primary
                           resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-semibold text-muted-foreground
                              uppercase tracking-wider"
                >
                  Variants & Stock
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add color, size, price and stock for each variant
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <VariantRow
                  key={index}
                  variant={variant}
                  index={index}
                  onChange={handleVariantChange}
                  onRemove={() => removeVariant(index)}
                  canRemove={variants.length > 1}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Product
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
