// src/components/products/ProductImageUpload.jsx
//
// Drag and drop image uploader for products
// Shows friendly seller-readable error messages via toast notifications
// Supports up to 6 images per product

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Loader2, Star, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/shared/Toast";
import { getImageUploadError } from "@/lib/errorMessages";
import api from "@/lib/api";

const MAX_IMAGES = 6;

// Friendly client-side validation messages
// These run before any API call is made
function validateFiles(files, currentCount) {
  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  const maxSizeMB = 5;

  for (const file of files) {
    if (!validTypes.includes(file.type)) {
      return `"${file.name}" is not a supported photo format. Please use JPG, PNG or WebP.`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return `"${file.name}" is ${sizeMB}MB which is too large. Please use a photo smaller than 5MB.`;
    }
  }

  if (currentCount + files.length > MAX_IMAGES) {
    const canAdd = MAX_IMAGES - currentCount;
    if (canAdd === 0) {
      return `You already have ${MAX_IMAGES} photos on this product. Remove one before adding more.`;
    }
    return `You can only add ${canAdd} more photo${canAdd > 1 ? "s" : ""} to this product (maximum is ${MAX_IMAGES}).`;
  }

  return null; // null means no error — all good
}

export default function ProductImageUpload({
  productId,
  images = [],
  onImagesChange,
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const inputRef = useRef(null);

  // ── UPLOAD HANDLER ────────────────────────────────────────────────────
  const handleFiles = async (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    // Validate before uploading — gives instant feedback
    const validationError = validateFiles(fileList, images.length);
    if (validationError) {
      showToast(validationError, "error", { title: "Cannot upload photo" });
      return;
    }

    setUploading(true);

    try {
      let currentImages = [...images];

      for (const file of fileList) {
        const formData = new FormData();
        formData.append("image", file);

        const res = await api.post(`/products/${productId}/images`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        currentImages = res.data.images;
      }

      onImagesChange(currentImages);

      // Success toast
      const count = fileList.length;
      showToast(
        count === 1
          ? "Photo added successfully!"
          : `${count} photos added successfully!`,
        "success",
      );
    } catch (err) {
      // Convert technical error to seller-friendly message
      const rawError = err.response?.data?.message || err.message || "";
      const friendlyError = getImageUploadError(rawError);
      showToast(friendlyError, "error", { title: "Upload failed" });
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // ── DELETE HANDLER ────────────────────────────────────────────────────
  const handleDelete = async (imageUrl, index) => {
    setDeletingIndex(index);
    try {
      const res = await api.delete(`/products/${productId}/images`, {
        data: { image_url: imageUrl },
      });
      onImagesChange(res.data.images);
      showToast("Photo removed.", "info");
    } catch (err) {
      showToast(
        "Could not remove this photo right now. Please try again.",
        "error",
        { title: "Remove failed" },
      );
    } finally {
      setDeletingIndex(null);
    }
  };

  // ── DRAG HANDLERS ─────────────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set dragOver false if leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Label + counter */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Product Photos
          <span className="text-muted-foreground font-normal ml-1.5">
            (up to {MAX_IMAGES})
          </span>
        </label>
        <span
          className={`text-xs font-medium tabular-nums
          ${
            images.length >= MAX_IMAGES
              ? "text-amber-500"
              : "text-muted-foreground"
          }`}
        >
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {images.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="relative aspect-square rounded-lg
                           overflow-hidden border border-border group"
              >
                <img
                  src={url}
                  alt={`Product photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Main photo badge on first image */}
                {index === 0 && (
                  <div
                    className="absolute top-1 left-1 flex items-center
                                  gap-0.5 bg-primary/90 text-primary-foreground
                                  text-xs px-1.5 py-0.5 rounded font-medium"
                  >
                    <Star className="w-2.5 h-2.5" />
                    Main
                  </div>
                )}

                {/* Delete button — shows on hover */}
                <button
                  onClick={() => handleDelete(url, index)}
                  disabled={deletingIndex !== null}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full
                             bg-black/60 text-white flex items-center
                             justify-center opacity-0 group-hover:opacity-100
                             transition-opacity hover:bg-red-500
                             disabled:opacity-50"
                >
                  {deletingIndex === index ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload drop zone — hidden when max reached */}
      {images.length < MAX_IMAGES && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6
            text-center transition-all duration-200 select-none
            ${
              uploading
                ? "opacity-60 cursor-not-allowed border-border"
                : dragOver
                  ? "border-primary bg-primary/5 scale-[1.01] cursor-copy"
                  : "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Uploading photo...
              </p>
              <p className="text-xs text-muted-foreground">
                Please wait, do not close this window
              </p>
            </div>
          ) : dragOver ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-full bg-primary/10 flex
                              items-center justify-center"
              >
                <ImagePlus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-primary">
                Drop your photos here
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-full bg-muted flex
                              items-center justify-center"
              >
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Click to add photos</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  or drag and drop here
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP · Max 5MB each · {MAX_IMAGES - images.length}{" "}
                more photo
                {MAX_IMAGES - images.length !== 1 ? "s" : ""} allowed
              </p>
            </div>
          )}
        </div>
      )}

      {/* Max reached message */}
      {images.length >= MAX_IMAGES && (
        <div
          className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950
                        border border-amber-200 dark:border-amber-800
                        rounded-lg px-3 py-2.5"
        >
          <CheckCircle2
            className="w-4 h-4 text-amber-600
                                   dark:text-amber-400 flex-shrink-0"
          />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Maximum 6 photos added. Remove a photo to upload a different one.
          </p>
        </div>
      )}
    </div>
  );
}
