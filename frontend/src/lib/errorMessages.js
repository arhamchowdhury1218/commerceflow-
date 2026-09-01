// src/lib/errorMessages.js
//
// Converts technical API errors into friendly messages for sellers
// Never show raw PHP errors or HTTP status codes to sellers

// Image upload specific errors
export function getImageUploadError(error) {
  const msg = error?.toLowerCase() || "";

  if (
    msg.includes("too large") ||
    msg.includes("max") ||
    msg.includes("5120") ||
    msg.includes("size")
  ) {
    return "This photo is too large. Please use a photo smaller than 5MB.";
  }
  if (
    msg.includes("mime") ||
    msg.includes("format") ||
    msg.includes("type") ||
    msg.includes("jpeg") ||
    msg.includes("png")
  ) {
    return "This file type is not supported. Please upload a JPG, PNG or WebP photo.";
  }
  if (
    msg.includes("cloudinary") ||
    msg.includes("upload failed") ||
    msg.includes("500")
  ) {
    return "Photo could not be uploaded right now. Please try again in a moment.";
  }
  if (msg.includes("unauthorized") || msg.includes("403")) {
    return "You do not have permission to upload photos for this product.";
  }
  if (
    msg.includes("timeout") ||
    msg.includes("connection") ||
    msg.includes("network")
  ) {
    return "Upload failed due to a connection issue. Please check your internet and try again.";
  }
  if (msg.includes("maximum") || msg.includes("limit") || msg.includes("6")) {
    return "You have reached the maximum of 6 photos per product.";
  }

  // Generic fallback
  return "Photo could not be uploaded. Please try again or use a different photo.";
}

// General API errors
export function getApiError(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message?.toLowerCase() || "";

  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You do not have permission to do this.";
  if (status === 404) return "This item could not be found.";
  if (status === 422) {
    // Validation errors — extract the first one
    const errors = error?.response?.data?.errors;
    if (errors) return Object.values(errors)[0][0];
    return (
      error?.response?.data?.message ||
      "Please check your information and try again."
    );
  }
  if (status === 429)
    return "Too many requests. Please wait a moment and try again.";
  if (status >= 500)
    return "Something went wrong on our end. Please try again in a moment.";
  if (message.includes("network") || !status) {
    return "Could not connect. Please check your internet connection.";
  }

  return "Something went wrong. Please try again.";
}

// Order specific errors
export function getOrderError(error) {
  const message = error?.response?.data?.message?.toLowerCase() || "";

  if (message.includes("stock") || message.includes("inventory")) {
    return "Not enough stock available for this order.";
  }
  if (message.includes("already booked") || message.includes("consignment")) {
    return "A SteadFast booking already exists for this order.";
  }

  return getApiError(error);
}
