// src/components/products/EditProductModal.jsx
//
// Full edit modal for an existing product
//
// What can be edited:
//   - Product name, base price, description
//   - Each variant: color, size, price, stock, threshold
//   - Add new variants
//   - Delete existing variants (min 1 must remain)
//   - Add or delete product images
//
// Props:
//   product   → the full product object with variants and images
//   onClose   → close the modal
//   onSuccess → refresh the product list after saving

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductImageUpload from "./ProductImageUpload";
import api from "@/lib/api";

// ── SINGLE VARIANT ROW ─────────────────────────────────────────────────────
// Inline editable row for one variant inside the edit modal
function EditVariantRow({
  variant,
  productBasePrice,
  onSave,
  onDelete,
  canDelete,
}) {
  const [form, setForm] = useState({
    color: variant.color || "",
    size: variant.size || "",
    price: variant.price || "",
    quantity: variant.inventory?.quantity ?? 0,
    low_stock_threshold: variant.inventory?.low_stock_threshold ?? 5,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(variant.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(variant.id);
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
      {/* Variant fields grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Color
          </label>
          <Input
            name="color"
            placeholder="Red"
            value={form.color}
            onChange={handleChange}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Size
          </label>
          <Input
            name="size"
            placeholder="XL"
            value={form.size}
            onChange={handleChange}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Price (৳)
          </label>
          <Input
            name="price"
            type="number"
            placeholder={productBasePrice}
            value={form.price}
            onChange={handleChange}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Stock
          </label>
          <Input
            name="quantity"
            type="number"
            min="0"
            value={form.quantity}
            onChange={handleChange}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Low Stock
          </label>
          <Input
            name="low_stock_threshold"
            type="number"
            min="0"
            value={form.low_stock_threshold}
            onChange={handleChange}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      {/* Row actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-green-400" /> Saved
              </>
            ) : (
              <>
                <Save className="w-3 h-3" /> Save variant
              </>
            )}
          </Button>
        </div>

        {/* Delete variant — disabled if this is the last one */}
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-destructive hover:text-destructive
                       hover:bg-destructive/10 gap-1.5"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── MAIN EDIT MODAL ────────────────────────────────────────────────────────
export default function EditProductModal({ product, onClose, onSuccess }) {
  // ── BASE PRODUCT STATE ─────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: product.name || "",
    base_price: product.base_price || "",
    description: product.description || "",
  });

  const [savingBase, setSavingBase] = useState(false);
  const [baseMsg, setBaseMsg] = useState(null);
  // baseMsg: { type: 'success' | 'error', text: string }

  // ── VARIANTS STATE ─────────────────────────────────────────────────────
  const [variants, setVariants] = useState(product.variants || []);
  // Local variants state — updated when variants are saved/deleted/added

  // ── NEW VARIANT STATE ──────────────────────────────────────────────────
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({
    color: "",
    size: "",
    price: "",
    quantity: 0,
    low_stock_threshold: 5,
  });
  const [addingVariant, setAddingVariant] = useState(false);
  const [addVariantError, setAddVariantError] = useState("");

  // ── IMAGES STATE ───────────────────────────────────────────────────────
  const [images, setImages] = useState(product.images || []);

  // ── HANDLERS ──────────────────────────────────────────────────────────

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setBaseMsg(null);
  };

  // Save product base info — name, price, description
  const handleSaveBase = async (e) => {
    e.preventDefault();
    setSavingBase(true);
    setBaseMsg(null);
    try {
      await api.put(`/products/${product.id}`, form);
      setBaseMsg({ type: "success", text: "Product info saved!" });
      onSuccess();
      // Refresh list in background so changes appear immediately
    } catch (err) {
      const errors = err.response?.data?.errors;
      setBaseMsg({
        type: "error",
        text: errors
          ? Object.values(errors)[0][0]
          : err.response?.data?.message || "Save failed.",
      });
    } finally {
      setSavingBase(false);
      setTimeout(() => setBaseMsg(null), 3000);
    }
  };

  // Save a single variant's changes
  const handleSaveVariant = async (variantId, data) => {
    await api.put(`/products/${product.id}/variants/${variantId}`, data);
    onSuccess();
    // Refresh background list — variant stock changes show in product list
  };

  // Delete a variant
  const handleDeleteVariant = async (variantId) => {
    await api.delete(`/products/${product.id}/variants/${variantId}`);
    // Remove from local state immediately for instant UI feedback
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
    onSuccess();
  };

  // Add a brand new variant to this product
  const handleAddVariant = async () => {
    // Block adding a variant that already exists (same color + size)
    const newKey = `${(newVariant.color || "").trim().toLowerCase()}|${(newVariant.size || "").trim().toLowerCase()}`;
    const exists = variants.some(
      (v) =>
        `${(v.color || "").trim().toLowerCase()}|${(v.size || "").trim().toLowerCase()}` ===
        newKey,
    );
    if (exists) {
      const label =
        `${newVariant.color || ""} ${newVariant.size || ""}`.trim() || "blank";
      setAddVariantError(
        `"${label}" already exists for this product. Each color/size must be unique.`,
      );
      return;
    }

    setAddingVariant(true);
    setAddVariantError("");
    try {
      const res = await api.post(
        `/products/${product.id}/variants`,
        newVariant,
      );
      // Add the new variant to local state so it appears immediately
      setVariants((prev) => [...prev, res.data]);
      setNewVariant({
        color: "",
        size: "",
        price: "",
        quantity: 0,
        low_stock_threshold: 5,
      });
      setShowAddVariant(false);
      onSuccess();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setAddVariantError(
        errors
          ? Object.values(errors)[0][0]
          : err.response?.data?.message || "Failed to add variant.",
      );
    } finally {
      setAddingVariant(false);
    }
  };

  return (
    // Backdrop
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
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between p-5 border-b
                        border-border sticky top-0 bg-card z-10"
        >
          <div>
            <h2 className="font-semibold text-base">Edit Product</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {product.name}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-6">
          {/* ── SECTION 1: PRODUCT INFO ─────────────────────────────────── */}
          <div className="space-y-4">
            <p
              className="text-sm font-semibold text-muted-foreground
                          uppercase tracking-wider"
            >
              Product Info
            </p>

            <form onSubmit={handleSaveBase} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Product name"
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
                  value={form.base_price}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={2}
                  placeholder="Brief product description..."
                  className="w-full text-sm border border-border rounded-md
                             px-3 py-2 bg-background text-foreground
                             focus:outline-none focus:ring-2 focus:ring-primary
                             resize-none"
                />
              </div>

              {/* Save base info button + feedback */}
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingBase}
                  className="gap-1.5"
                >
                  {savingBase ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Info
                    </>
                  )}
                </Button>
                {baseMsg && (
                  <span
                    className={`text-sm font-medium flex items-center gap-1.5
                    ${
                      baseMsg.type === "success"
                        ? "text-green-600 dark:text-green-400"
                        : "text-destructive"
                    }`}
                  >
                    {baseMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {baseMsg.text}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* ── SECTION 2: PRODUCT IMAGES ───────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p
                className="text-sm font-semibold text-muted-foreground
                            uppercase tracking-wider"
              >
                Product Images
              </p>
              <span className="text-xs text-muted-foreground">
                {images.length}/6
              </span>
            </div>

            {/* ProductImageUpload handles both display of existing images
                and uploading new ones — same component as AddProductModal */}
            <ProductImageUpload
              productId={product.id}
              images={images}
              onImagesChange={(newImages) => {
                setImages(newImages);
                onSuccess();
                // Refresh list so new images appear in ProductCard immediately
              }}
            />
          </div>

          {/* ── SECTION 3: VARIANTS ─────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p
                className="text-sm font-semibold text-muted-foreground
                            uppercase tracking-wider"
              >
                Variants ({variants.length})
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setShowAddVariant(!showAddVariant)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Variant
              </Button>
            </div>

            {/* Existing variants — one EditVariantRow per variant */}
            <div className="space-y-3">
              {variants.map((variant) => (
                <EditVariantRow
                  key={variant.id}
                  variant={variant}
                  productBasePrice={form.base_price}
                  onSave={handleSaveVariant}
                  onDelete={handleDeleteVariant}
                  canDelete={variants.length > 1}
                  // canDelete=false when only 1 variant remains
                  // every product must have at least one variant
                />
              ))}
            </div>

            {/* ── ADD NEW VARIANT FORM ─────────────────────────────────── */}
            <AnimatePresence>
              {showAddVariant && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className="bg-primary/5 border border-primary/20
                                  rounded-xl p-4 space-y-3"
                  >
                    <p className="text-xs font-semibold text-primary">
                      New Variant
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div className="space-y-1">
                        <label
                          className="text-xs font-medium
                                         text-muted-foreground"
                        >
                          Color
                        </label>
                        <Input
                          placeholder="Red"
                          value={newVariant.color}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              color: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          className="text-xs font-medium
                                         text-muted-foreground"
                        >
                          Size
                        </label>
                        <Input
                          placeholder="XL"
                          value={newVariant.size}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              size: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          className="text-xs font-medium
                                         text-muted-foreground"
                        >
                          Price (৳)
                        </label>
                        <Input
                          type="number"
                          placeholder={form.base_price}
                          value={newVariant.price}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              price: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          className="text-xs font-medium
                                         text-muted-foreground"
                        >
                          Stock
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={newVariant.quantity}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              quantity: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          className="text-xs font-medium
                                         text-muted-foreground"
                        >
                          Low Stock
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={newVariant.low_stock_threshold}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              low_stock_threshold: e.target.value,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {addVariantError && (
                      <p
                        className="text-xs text-destructive flex
                                    items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {addVariantError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5 h-8 text-xs"
                        onClick={handleAddVariant}
                        disabled={addingVariant}
                      >
                        {addingVariant ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" /> Add Variant
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => {
                          setShowAddVariant(false);
                          setAddVariantError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div
          className="flex justify-end px-5 py-4 border-t border-border
                        sticky bottom-0 bg-card"
        >
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
