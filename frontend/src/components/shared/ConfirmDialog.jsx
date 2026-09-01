// src/components/shared/ConfirmDialog.jsx
//
// Reusable confirmation popup used whenever a destructive action needs confirmation
// Replaces the browser's default window.confirm() which looks terrible
//
// Usage example:
//   const { confirm, ConfirmDialogComponent } = useConfirmDialog()
//
//   const handleDelete = async () => {
//     const ok = await confirm({
//       title:       'Delete Product',
//       description: 'This will permanently delete the product and all its variants.',
//       confirmText: 'Delete',
//       type:        'danger',    // 'danger' | 'warning' | 'info'
//     })
//     if (!ok) return
//     // proceed with delete
//   }
//
//   return (
//     <>
//       <button onClick={handleDelete}>Delete</button>
//       {ConfirmDialogComponent}
//     </>
//   )

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── THE DIALOG UI ─────────────────────────────────────────────────────────

function ConfirmDialog({ open, config, onConfirm, onCancel }) {
  if (!config) return null;

  const {
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger",
    // type options:
    // 'danger'  → red  — for delete/irreversible actions
    // 'warning' → amber — for risky but reversible actions
    // 'info'    → blue  — for neutral confirmations
  } = config;

  // Style maps based on type
  const styles = {
    danger: {
      iconBg: "bg-red-100 dark:bg-red-950",
      iconColor: "text-red-600 dark:text-red-400",
      buttonClass: "bg-red-600 hover:bg-red-700 text-white",
      Icon: Trash2,
    },
    warning: {
      iconBg: "bg-amber-100 dark:bg-amber-950",
      iconColor: "text-amber-600 dark:text-amber-400",
      buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
      Icon: AlertTriangle,
    },
    info: {
      iconBg: "bg-blue-100 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      Icon: Info,
    },
  };

  const { iconBg, iconColor, buttonClass, Icon } =
    styles[type] || styles.danger;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onCancel}
          />

          {/* Dialog panel */}
          <div
            className="fixed inset-0 z-50 flex items-center
                          justify-center p-4 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-card border border-border rounded-2xl
                         shadow-xl w-full max-w-sm pointer-events-auto"
            >
              {/* Top right close button */}
              <div className="flex justify-end p-3 pb-0">
                <button
                  onClick={onCancel}
                  className="w-7 h-7 rounded-full flex items-center
                             justify-center text-muted-foreground
                             hover:text-foreground hover:bg-muted
                             transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 pt-2 text-center space-y-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-full ${iconBg}
                                 flex items-center justify-center mx-auto`}
                >
                  <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>

                {/* Title + description */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2.5 pt-1">
                  {/* Cancel — neutral, secondary */}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                  >
                    {cancelText}
                  </Button>

                  {/* Confirm — styled based on type */}
                  <button
                    onClick={onConfirm}
                    className={`flex-1 px-4 py-2 rounded-md text-sm
                      font-medium transition-colors ${buttonClass}`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── THE HOOK ──────────────────────────────────────────────────────────────
// useConfirmDialog returns:
//   confirm(config) → Promise<boolean>  call this to show the dialog
//   ConfirmDialogComponent              render this somewhere in your JSX

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [resolver, setResolver] = useState(null);
  // resolver holds the resolve function of the Promise
  // when the user clicks Confirm or Cancel, we call it with true/false

  const confirm = useCallback((cfg) => {
    setConfig(cfg);
    setOpen(true);
    // Return a Promise that resolves when the user makes a choice
    return new Promise((resolve) => {
      setResolver(() => resolve);
      // We store resolve in state so the button handlers can call it
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolver?.(true);
    // true = user confirmed
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolver?.(false);
    // false = user cancelled
  }, [resolver]);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      open={open}
      config={config}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialogComponent };
}
