import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

export default function AddCustomerModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    delivery_address: "",
    source_channel: "manual",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/customers", form);
      onSuccess();
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors)[0][0]
          : err.response?.data?.message || "Failed to create customer.",
      );
    } finally {
      setLoading(false);
    }
  };

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
        className="bg-card border border-border rounded-2xl w-full max-w-md
                   shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5
                        border-b border-border"
        >
          <div>
            <h2 className="font-semibold text-base">Add New Customer</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the customer's details
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="Customer name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Phone <span className="text-destructive">*</span>
              </label>
              <Input
                name="phone"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email (optional)</label>
            <Input
              name="email"
              type="email"
              placeholder="customer@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Delivery Address</label>
            <Input
              name="delivery_address"
              placeholder="Full delivery address"
              value={form.delivery_address}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Source Channel</label>
            <select
              name="source_channel"
              value={form.source_channel}
              onChange={handleChange}
              className="w-full text-sm border border-border rounded-md
                         px-3 py-2 bg-background text-foreground
                         focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="manual">Manual</option>
              <option value="facebook">Facebook Page</option>
              <option value="messenger">Messenger</option>
              <option value="instagram">Instagram DM</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook_comment">Facebook Comment</option>
            </select>
          </div>

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
                  <Plus className="w-4 h-4" /> Add Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
