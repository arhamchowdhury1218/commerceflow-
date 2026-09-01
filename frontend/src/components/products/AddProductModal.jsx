// src/components/products/AddProductModal.jsx
//
// Modal form for creating a new product with variants and images
//
// Flow:
//   Step 1 → Seller fills in product name, price, description
//   Step 2 → Seller adds variants (color, size, stock, price per variant)
//   Step 3 → After submission, product is created in the database
//   Step 4 → Image upload section appears — seller uploads 1-6 photos
//   Step 5 → Seller clicks Done or Skip — modal closes and list refreshes
//
// Props:
//   onClose   → function to close the modal
//   onSuccess → function to refresh the product list after creation

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VariantRow from "./VariantRow";
// VariantRow handles one row of variant input:
// color, size, price override, quantity, low stock threshold

import ProductImageUpload from "./ProductImageUpload";
// ProductImageUpload handles drag-and-drop image upload to Cloudinary
// It appears AFTER the product is created so we have a product ID to attach images to

import api from "@/lib/api";

export default function AddProductModal({ onClose, onSuccess }) {
  // ── FORM STATE ─────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(false);
  // loading = true while the POST /products API call is in progress
  // disables the submit button to prevent double submission

  const [error, setError] = useState("");
  // error stores the first validation error returned by Laravel
  // or a generic fallback message

  // Product base info — shared across all variants
  const [product, setProduct] = useState({
    name: "",
    base_price: "",
    description: "",
  });

  // Variants list — each object represents one size/color combination
  // We start with ONE empty variant row because every product needs at least one
  const [variants, setVariants] = useState([
    { color: "", size: "", price: "", quantity: "", low_stock_threshold: 5 },
  ]);

  // ── POST-CREATION STATE ────────────────────────────────────────────────

  const [createdProduct, setCreatedProduct] = useState(null);
  // After the product is successfully created, we store the full product object here
  // This gives us the product.id needed for the image upload API calls
  // When createdProduct is not null, we switch from the form view to the image upload view

  // ── HANDLERS ──────────────────────────────────────────────────────────

  // Generic change handler for the product base fields
  // Uses computed property name [e.target.name] to update the right field
  // Example: typing in the "name" input updates product.name
  const handleProductChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
    setError("");
    // Clear error on every keystroke so the red message disappears
    // as soon as the seller starts correcting the issue
  };

  // Update a specific field in a specific variant row
  // index → which row (0, 1, 2...)
  // field → which field ('color', 'size', 'price', 'quantity', 'low_stock_threshold')
  // value → the new value
  const handleVariantChange = (index, field, value) => {
    setVariants(
      variants.map(
        (v, i) => (i === index ? { ...v, [field]: value } : v),
        // Spread all existing variant fields, then override just the changed one
      ),
    );
  };

  // Add a new empty variant row at the bottom of the list
  const addVariant = () => {
    setVariants([
      ...variants,
      { color: "", size: "", price: "", quantity: "", low_stock_threshold: 5 },
    ]);
  };

  // Remove a specific variant row by its index
  // filter keeps all rows where the index does NOT match
  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // ── SUBMIT PRODUCT ─────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    // e.preventDefault() stops the browser from doing a full page reload
    // which is the default behaviour for HTML form submissions

    // ── DUPLICATE VARIANT CHECK ─────────────────────────────────────────
    // Two rows with the same color + size are really the same variant.
    // Catch it here for instant feedback before hitting the server.
    const seen = new Set();
    for (const v of variants) {
      const key = `${(v.color || "").trim().toLowerCase()}|${(v.size || "").trim().toLowerCase()}`;
      if (seen.has(key)) {
        const label = `${v.color || ""} ${v.size || ""}`.trim() || "blank";
        setError(
          `Duplicate variant: "${label}" is listed more than once. Each color/size combination must be unique.`,
        );
        return;
      }
      seen.add(key);
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/products", {
        name: product.name,
        base_price: product.base_price,
        description: product.description,
        variants: variants.map((v) => ({
          color: v.color || null,
          // null instead of empty string — Laravel treats them differently
          // null means "no color" while "" could cause validation issues
          size: v.size || null,
          price: v.price || null,
          // null price means "use the product base price"
          quantity: parseInt(v.quantity) || 0,
          // parseInt converts the string from the input to an integer
          // || 0 ensures we send 0 instead of NaN if the field is empty
          low_stock_threshold: parseInt(v.low_stock_threshold) || 5,
        })),
      });

      // Product created successfully
      // Instead of closing the modal immediately, we store the created product
      // and show the image upload section
      // The seller can now optionally add photos before finishing
      setCreatedProduct(res.data);
    } catch (err) {
      // Laravel validation errors come back as:
      // { errors: { field: ['error message'] } }
      // We grab the first error from whatever field failed
      const errors = err.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors)[0][0]
          : err.response?.data?.message || "Failed to create product.",
      );
    } finally {
      setLoading(false);
      // finally runs whether the request succeeded or failed
      // always re-enable the submit button
    }
  };

  // ── FINISH (after image upload step) ──────────────────────────────────

  const handleFinish = () => {
    // Called when seller clicks "Done" or "Skip for now" after image upload
    onSuccess();
    // Tell the Products page to refresh its list so the new product appears
    onClose();
    // Close the modal
  };

  return (
    // ── BACKDROP ──────────────────────────────────────────────────────────
    // The dark overlay behind the modal
    // Clicking it closes the modal (good UX — users expect this)
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center
                 justify-center p-4"
      onClick={onClose}
    >
      {/* ── MODAL PANEL ─────────────────────────────────────────────────────
          motion.div gives the modal a scale+fade entrance animation
          onClick stopPropagation prevents clicks inside the modal
          from bubbling up to the backdrop and closing it accidentally */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-2xl w-full max-w-2xl
                   max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ────────────────────────────────────────────────
            sticky top-0 keeps the header visible when content is scrolled
            bg-card matches the modal background so it doesn't look cut off */}
        <div
          className="flex items-center justify-between p-5 border-b
                        border-border sticky top-0 bg-card z-10"
        >
          <div>
            <h2 className="font-semibold text-base">
              {createdProduct ? "Add Product Photos" : "Add New Product"}
            </h2>
            {/* Title changes after product is created to reflect
                that we are now in the image upload step */}
            <p className="text-xs text-muted-foreground mt-0.5">
              {createdProduct
                ? "Upload photos so customers can see your product clearly"
                : "Fill in product details and add variants with stock levels"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* ── MODAL BODY ──────────────────────────────────────────────────── */}

        {/* ── STEP 1 & 2: PRODUCT FORM ──────────────────────────────────────
            Only shown when createdProduct is null (product not yet created)
            Once the product is created, this section is replaced by image upload */}
        {!createdProduct && (
          <form onSubmit={handleSubmit} className="p-5 space-y-6">
            {/* Error message from server */}
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

            {/* ── PRODUCT INFO SECTION ──────────────────────────────────── */}
            <div className="space-y-4">
              <p
                className="text-sm font-semibold text-muted-foreground
                            uppercase tracking-wider"
              >
                Product Info
              </p>

              {/* Product name */}
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

              {/* Base price */}
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
                  Used when a variant does not have its own specific price
                </p>
              </div>

              {/* Description */}
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

            {/* ── VARIANTS SECTION ──────────────────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-semibold text-muted-foreground
                                uppercase tracking-wider"
                  >
                    Variants and Stock
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add each color and size combination with its own stock
                    quantity
                  </p>
                </div>
                {/* Add variant button — appends a new empty row */}
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

              {/* Render one VariantRow component per variant in the array
                  key={index} is acceptable here because we always add to the end
                  and never reorder — so index is stable enough as a key */}
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <VariantRow
                    key={index}
                    variant={variant}
                    index={index}
                    onChange={handleVariantChange}
                    onRemove={() => removeVariant(index)}
                    canRemove={variants.length > 1}
                    // canRemove=false when there is only 1 variant
                    // prevents the seller from removing the last row
                    // because every product needs at least 1 variant
                  />
                ))}
              </div>
            </div>

            {/* ── FORM ACTIONS ──────────────────────────────────────────── */}
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
        )}

        {/* ── STEP 3 & 4: IMAGE UPLOAD ──────────────────────────────────────
            Shown AFTER the product has been successfully created
            We need createdProduct.id to attach images to this specific product
            The seller can upload 1-6 images or skip this step entirely */}
        {createdProduct && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-5 space-y-5"
          >
            {/* Success confirmation banner */}
            <div
              className="flex items-center gap-2 bg-green-50 dark:bg-green-950
                            border border-green-200 dark:border-green-800
                            rounded-lg px-4 py-3"
            >
              <CheckCircle2
                className="w-4 h-4 text-green-600
                                       dark:text-green-400 flex-shrink-0"
              />
              <div>
                <p
                  className="text-sm font-medium text-green-700
                              dark:text-green-300"
                >
                  Product created successfully!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  Now add photos so customers can see your product. You can also
                  skip this and add photos later.
                </p>
              </div>
            </div>

            {/* ProductImageUpload component
                productId  → the newly created product's ID, used in API calls:
                             POST /api/products/{productId}/images
                images     → current images array (starts empty for new products)
                onImagesChange → called after each upload/delete with the updated images array
                              we update createdProduct.images so the UI stays in sync */}
            <ProductImageUpload
              productId={createdProduct.id}
              images={createdProduct.images || []}
              onImagesChange={(newImages) =>
                setCreatedProduct((prev) => ({ ...prev, images: newImages }))
              }
            />

            {/* Action buttons for the image upload step */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleFinish}
                className="flex-1"
              >
                Skip for now
                {/* Seller can always add images later by editing the product */}
              </Button>
              <Button
                type="button"
                onClick={handleFinish}
                className="flex-1 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {createdProduct.images?.length > 0
                  ? `Done — ${createdProduct.images.length} photo${createdProduct.images.length > 1 ? "s" : ""} added`
                  : "Done"}
                {/* Button label shows how many photos were uploaded
                    so the seller gets clear confirmation before closing */}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
