import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/shared/Toast";
import api from "@/lib/api";

export default function useProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/products");
      setProducts(res.data.data || res.data);
    } catch (err) {
      setError("Failed to load products");
      showToast(
        "Could not load your products. Please refresh the page.",
        "error",
        { title: "Loading failed" },
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = async (id, confirmFn) => {
    if (confirmFn) {
      const ok = await confirmFn({
        title: "Delete Product",
        description:
          "This will permanently delete the product, all its variants, and stock records. This cannot be undone.",
        confirmText: "Delete Product",
        cancelText: "Keep it",
        type: "danger",
      });
      if (!ok) return;
    }
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Product deleted successfully.", "success");
    } catch (err) {
      showToast("Could not delete this product. Please try again.", "error", {
        title: "Delete failed",
      });
    }
  };

  const toggleStatus = async (product) => {
    try {
      await api.patch(`/products/${product.id}/status`);
      const newStatus = product.status === "active" ? "inactive" : "active";
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, status: newStatus } : p,
        ),
      );
      showToast(
        newStatus === "active"
          ? `"${product.name}" is now active and available for orders.`
          : `"${product.name}" is now inactive and hidden from orders.`,
        "info",
      );
    } catch (err) {
      showToast("Could not update product status. Please try again.", "error");
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    deleteProduct,
    toggleStatus,
  };
}
