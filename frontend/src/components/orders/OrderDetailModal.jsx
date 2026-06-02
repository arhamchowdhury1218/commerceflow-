// src/components/orders/OrderDetailModal.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge, {
  orderStatusConfig,
  paymentStatusConfig,
} from "./StatusBadge";
import api from "@/lib/api";

export default function OrderDetailModal({ order, onClose, onStatusUpdate }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(order?.order_status);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Update order status via PATCH /api/orders/{id}/status
  const handleStatusUpdate = async () => {
    if (newStatus === order.order_status) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/orders/${order.id}/status`, {
        order_status: newStatus,
      });
      onStatusUpdate(order.id, newStatus);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Book SteadFast consignment for this order
  const handleBookSteadFast = async () => {
    setBooking(true);
    setBookingResult(null);
    try {
      const res = await api.post(`/deliveries/book/${order.id}`);
      setBookingResult({
        success: true,
        tracking: res.data.tracking_code,
        consignment: res.data.consignment_id,
      });
      // Update order status to shipped in parent list
      onStatusUpdate(order.id, "shipped");
    } catch (err) {
      setBookingResult({
        success: false,
        message: err.response?.data?.message || "Booking failed. Try again.",
      });
    } finally {
      setBooking(false);
    }
  };

  if (!order) return null;

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
        className="bg-card border border-border rounded-2xl w-full max-w-lg
                   max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between p-5
                        border-b border-border"
        >
          <div>
            <h2 className="font-semibold text-base">
              Order #CF-{String(order.id).padStart(4, "0")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.created_at).toLocaleDateString("en-BD", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* ── CUSTOMER ────────────────────────────────────────────────── */}
          <div>
            <p
              className="text-xs font-medium text-muted-foreground
                          uppercase tracking-wider mb-2"
            >
              Customer
            </p>
            <div className="bg-muted/40 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{order.customer?.name}</p>
              <p className="text-xs text-muted-foreground">
                {order.customer?.phone}
              </p>
              {order.customer?.email && (
                <p className="text-xs text-muted-foreground">
                  {order.customer.email}
                </p>
              )}
              {order.customer?.delivery_address && (
                <p className="text-xs text-muted-foreground mt-1">
                  {order.customer.delivery_address}
                </p>
              )}
            </div>
          </div>

          {/* ── ORDER ITEMS ──────────────────────────────────────────────── */}
          <div>
            <p
              className="text-xs font-medium text-muted-foreground
                          uppercase tracking-wider mb-2"
            >
              Items
            </p>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between
                             bg-muted/40 rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.variant?.product?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.variant?.color && `${item.variant.color} · `}
                      {item.variant?.size && item.variant.size}
                      {` · Qty: ${item.quantity}`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    ৳{Number(item.subtotal).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── PRICE BREAKDOWN ──────────────────────────────────────────── */}
          <div>
            <p
              className="text-xs font-medium text-muted-foreground
                          uppercase tracking-wider mb-2"
            >
              Payment
            </p>
            <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳{Number(order.subtotal).toLocaleString()}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">
                    -৳{Number(order.discount).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>৳{Number(order.delivery_charge).toLocaleString()}</span>
              </div>
              <div
                className="flex justify-between text-sm font-bold
                              border-t border-border pt-1.5 mt-1.5"
              >
                <span>Total</span>
                <span>৳{Number(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* ── STATUS BADGES ────────────────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap">
            <StatusBadge
              status={order.payment_status}
              config={paymentStatusConfig}
            />
            <StatusBadge
              status={order.order_status}
              config={orderStatusConfig}
            />
            {order.courier_name && (
              <span
                className="inline-flex items-center px-2.5 py-0.5
                rounded-full text-xs font-medium bg-secondary
                text-secondary-foreground capitalize"
              >
                {order.courier_name}
              </span>
            )}
          </div>

          {/* ── STEADFAST BOOKING ────────────────────────────────────────── */}
          {/* Show booking button only when:
              1. Courier is SteadFast
              2. No consignment has been booked yet */}
          {order.courier_name === "steadfast" &&
            !order.delivery?.consignment_id &&
            !bookingResult?.success && (
              <div>
                <p
                  className="text-xs font-medium text-muted-foreground
                            uppercase tracking-wider mb-2"
                >
                  SteadFast Courier
                </p>
                <Button
                  onClick={handleBookSteadFast}
                  disabled={booking}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Booking...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" /> Book SteadFast Consignment
                    </>
                  )}
                </Button>
              </div>
            )}

          {/* Show tracking code if already booked BEFORE opening modal
              (consignment was booked in a previous session) */}
          {order.delivery?.tracking_number && !bookingResult && (
            <div
              className="bg-green-50 dark:bg-green-950 border
                            border-green-200 dark:border-green-800
                            rounded-lg px-4 py-3"
            >
              <p
                className="text-xs font-medium text-green-700
                            dark:text-green-300 mb-1"
              >
                SteadFast Booked
              </p>
              <p
                className="text-sm font-mono font-bold text-green-800
                            dark:text-green-200"
              >
                {order.delivery.tracking_number}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                Consignment: {order.delivery.consignment_id}
              </p>
            </div>
          )}

          {/* Show result after booking attempt in this session
              Success → green with tracking number
              Failure → red with error message */}
          {bookingResult && (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium
              ${
                bookingResult.success
                  ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              }`}
            >
              {bookingResult.success ? (
                <div>
                  <p>Booked successfully!</p>
                  <p className="font-mono font-bold mt-1">
                    Tracking: {bookingResult.tracking}
                  </p>
                  <p className="text-xs mt-0.5 opacity-75">
                    Consignment: {bookingResult.consignment}
                  </p>
                </div>
              ) : (
                bookingResult.message
              )}
            </div>
          )}

          {/* ── STATUS UPDATE ────────────────────────────────────────────── */}
          <div>
            <p
              className="text-xs font-medium text-muted-foreground
                          uppercase tracking-wider mb-2"
            >
              Update Status
            </p>
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex-1 text-sm border border-border rounded-md
                           px-3 py-2 bg-background text-foreground
                           focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(orderStatusConfig).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleStatusUpdate}
                disabled={updatingStatus || newStatus === order.order_status}
                size="sm"
              >
                {updatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
