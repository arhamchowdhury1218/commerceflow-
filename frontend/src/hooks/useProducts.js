// Custom hook that handles all product data fetching
// WHY hooks? So Products.jsx doesn't need to know HOW data is fetched
// The page just calls useProducts() and gets data + actions back
// If you change the API later, you only change this file

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export default function useProducts() {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      // Remove from local state immediately — no refetch needed
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (product) => {
    try {
      await api.put(`/products/${product.id}`, {
        status: product.status === "active" ? "inactive" : "active",
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, status: p.status === "active" ? "inactive" : "active" }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
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
