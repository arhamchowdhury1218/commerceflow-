// src/components/shared/Toast.jsx
//
// Global toast notification system
// Shows friendly messages to sellers for success, errors, and warnings
//
// Usage anywhere in the app:
//   const { showToast } = useToast()
//   showToast('Photo uploaded successfully!', 'success')
//   showToast('Photo is too large. Please use a photo under 5MB.', 'error')

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ── CONTEXT ───────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ── SINGLE TOAST ITEM ─────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const configs = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-green-500",
      bg: "bg-card",
      border: "border-green-200 dark:border-green-800",
      bar: "bg-green-500",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-500",
      bg: "bg-card",
      border: "border-red-200 dark:border-red-800",
      bar: "bg-red-500",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bg: "bg-card",
      border: "border-amber-200 dark:border-amber-800",
      bar: "bg-amber-500",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-500",
      bg: "bg-card",
      border: "border-blue-200 dark:border-blue-800",
      bar: "bg-blue-500",
    },
  };

  const config = configs[toast.type] || configs.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`relative flex items-start gap-3 w-80 rounded-xl
                  shadow-lg border ${config.bg} ${config.border}
                  overflow-hidden p-4`}
    >
      {/* Coloured left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar}`} />

      {/* Icon */}
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-foreground leading-tight">
            {toast.title}
          </p>
        )}
        <p
          className={`text-sm text-muted-foreground leading-relaxed
          ${toast.title ? "mt-0.5" : ""}`}
        >
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-muted-foreground
                   hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Auto-dismiss progress bar at bottom */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: toast.duration / 1000, ease: "linear" }}
        className={`absolute bottom-0 left-0 right-0 h-0.5
                    ${config.bar} opacity-40 origin-left`}
      />
    </motion.div>
  );
}

// ── TOAST PROVIDER ────────────────────────────────────────────────────────
// Wrap your app with this so any component can call showToast()
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", options = {}) => {
      const id = Date.now() + Math.random();
      const duration = options.duration || 4000;
      // duration in ms — how long the toast stays visible

      const toast = {
        id,
        message,
        type,
        duration,
        title: options.title || null,
      };

      setToasts((prev) => [...prev, toast]);

      // Auto-remove after duration
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed top-right corner */}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2
                      pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ── HOOK ──────────────────────────────────────────────────────────────────
// Call this inside any component to get showToast
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
