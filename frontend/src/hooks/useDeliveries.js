import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export default function useDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/deliveries");
      setDeliveries(res.data.data || res.data);
    } catch (err) {
      setError("Failed to load deliveries");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Sync a single delivery status from SteadFast
  const syncDelivery = async (deliveryId) => {
    try {
      const res = await api.post(`/deliveries/sync/${deliveryId}`);
      // Update the delivery in local state
      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? res.data.delivery : d)),
      );
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Sync failed",
      };
    }
  };

  // Sync all active deliveries at once
  const syncAll = async () => {
    try {
      const res = await api.post("/deliveries/sync-all");
      // Refresh the full list after bulk sync
      await fetchDeliveries();
      return { success: true, updated: res.data.updated };
    } catch (err) {
      return { success: false, message: "Sync all failed" };
    }
  };

  return {
    deliveries,
    loading,
    error,
    fetchDeliveries,
    syncDelivery,
    syncAll,
  };
}
