// src/pages/NewOrder.jsx
// Multi-step order creation form
// Step 1: Customer → Step 2: Products → Step 3: Payment → Step 4: Confirm

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Minus,
  X,
  Check,
  User,
  Package,
  CreditCard,
  ClipboardCheck,
  Loader2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────

const steps = [
  { id: 1, label: "Customer", icon: User },
  { id: 2, label: "Products", icon: Package },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Confirm", icon: ClipboardCheck },
];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isDone = step.id < currentStep;
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center
                justify-center transition-all duration-300 border-2
                ${
                  isDone
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary bg-background"
                      : "border-muted-foreground/30 text-muted-foreground/50 bg-background"
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block
                ${isActive ? "text-foreground" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 transition-colors duration-300
                ${step.id < currentStep ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── STEP 1: CUSTOMER SELECTION ───────────────────────────────────────────────

function CustomerStep({ selected, onSelect, prefill }) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  // If we arrived from a Messenger chat, jump straight to the
  // "new customer" form instead of the search view.
  const [mode, setMode] = useState(prefill?.name ? "new" : "search");
  const [newCustomer, setNewCustomer] = useState({
    name: prefill?.name || "",
    phone: "",
    email: "",
    delivery_address: "",
    source_channel: prefill?.source_channel || "manual",
  });

  useEffect(() => {
    if (search.length < 2) {
      setCustomers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/customers");
        const all = res.data.data || res.data;
        setCustomers(
          all.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.phone.includes(search),
          ),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleNewCustomerChange = (e) => {
    setNewCustomer({ ...newCustomer, [e.target.name]: e.target.value });
  };

  const handleCreateAndSelect = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    setLoading(true);
    try {
      const res = await api.post("/customers", newCustomer);
      onSelect(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold mb-1">Select Customer</h2>
        <p className="text-sm text-muted-foreground">
          Search for an existing customer or add a new one
        </p>
      </div>

      {selected && (
        <div
          className="flex items-center justify-between bg-primary/10
                        border border-primary/30 rounded-lg px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium">{selected.name}</p>
            <p className="text-xs text-muted-foreground">{selected.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onSelect(null)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={mode === "search" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("search")}
          className="gap-1.5"
        >
          <Search className="w-3.5 h-3.5" /> Search
        </Button>
        <Button
          variant={mode === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("new")}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Customer
        </Button>
      </div>

      {mode === "search" && (
        <div className="space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-muted-foreground"
            />
            <Input
              placeholder="Type customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {customers.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              {customers.map((customer, i) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    onSelect(customer);
                    setSearch("");
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/60
                    transition-colors flex items-center justify-between
                    ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.phone}
                      {customer.orders_count > 0 &&
                        ` · ${customer.orders_count} previous orders`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
          {search.length >= 2 && !loading && customers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No customer found.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setMode("new");
                  setNewCustomer((p) => ({ ...p, name: search }));
                }}
              >
                Create new customer
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === "new" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={handleNewCustomerChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Phone <span className="text-destructive">*</span>
              </label>
              <Input
                name="phone"
                placeholder="01XXXXXXXXX"
                value={newCustomer.phone}
                onChange={handleNewCustomerChange}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email (optional)</label>
            <Input
              name="email"
              type="email"
              placeholder="customer@email.com"
              value={newCustomer.email}
              onChange={handleNewCustomerChange}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Delivery Address</label>
            <Input
              name="delivery_address"
              placeholder="Full delivery address"
              value={newCustomer.delivery_address}
              onChange={handleNewCustomerChange}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Source Channel</label>
            <select
              name="source_channel"
              value={newCustomer.source_channel}
              onChange={handleNewCustomerChange}
              className="w-full text-sm border border-border rounded-md px-3 py-2
                         bg-background text-foreground focus:outline-none
                         focus:ring-2 focus:ring-primary"
            >
              <option value="manual">Manual</option>
              <option value="facebook">Facebook Page</option>
              <option value="messenger">Messenger</option>
              <option value="instagram">Instagram DM</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook_comment">Facebook Comment</option>
            </select>
          </div>
          <Button
            onClick={handleCreateAndSelect}
            disabled={loading || !newCustomer.name || !newCustomer.phone}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Create & Select Customer
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── STEP 2: PRODUCT SELECTION ────────────────────────────────────────────────

function ProductStep({ items, onItemsChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data.data || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addItem = (variant, product) => {
    const stock = variant.inventory?.quantity || 0;
    const existing = items.find((i) => i.product_variant_id === variant.id);

    if (existing) {
      // ── STOCK CHECK: cannot exceed available stock ──────────────────
      // If already at max stock, do nothing — button is disabled anyway
      // but this is a safety guard
      if (existing.quantity >= stock) return;

      onItemsChange(
        items.map((i) =>
          i.product_variant_id === variant.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        ),
      );
    } else {
      if (stock === 0) return; // Out of stock — do not add
      onItemsChange([
        ...items,
        {
          product_variant_id: variant.id,
          quantity: 1,
          unit_price: variant.price || product.base_price,
          variantLabel: `${variant.color || ""} ${variant.size || ""}`.trim(),
          productName: product.name,
          // ── STORE STOCK ─────────────────────────────────────────────
          // Store the available stock with the item so we can check it
          // when the seller clicks + in the order items summary above
          stock: stock,
        },
      ]);
    }
  };

  // updateQty is used in the order summary — delta is +1 or -1
  const updateQty = (variantId, delta, maxStock) => {
    onItemsChange(
      items
        .map((i) => {
          if (i.product_variant_id !== variantId) return i;

          const newQty = i.quantity + delta;

          // ── PREVENT EXCEEDING STOCK ──────────────────────────────────
          // If trying to increase beyond available stock, keep current qty
          if (delta > 0 && newQty > maxStock) return i;

          return { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity > 0),
      // filter removes item when quantity drops to 0
    );
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold mb-1">Add Products</h2>
        <p className="text-sm text-muted-foreground">
          Select products and variants for this order
        </p>
      </div>

      {/* ── ORDER ITEMS SUMMARY ────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="bg-muted/40 rounded-lg p-3 space-y-2">
          <p
            className="text-xs font-medium text-muted-foreground uppercase
                        tracking-wider"
          >
            Order Items
          </p>
          {items.map((item) => {
            // ── AT MAX STOCK CHECK ───────────────────────────────────
            // item.stock was stored when the item was first added
            const atMaxStock = item.quantity >= item.stock;

            return (
              <div key={item.product_variant_id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.productName}
                    </p>
                    {item.variantLabel && (
                      <p className="text-xs text-muted-foreground">
                        {item.variantLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ৳{(item.unit_price * item.quantity).toLocaleString()}
                    </span>
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      {/* Minus button — always enabled, removes item at 0 */}
                      <button
                        onClick={() =>
                          updateQty(item.product_variant_id, -1, item.stock)
                        }
                        className="w-6 h-6 rounded border border-border flex
                                   items-center justify-center hover:bg-muted
                                   transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="text-sm font-medium w-6 text-center tabular-nums">
                        {item.quantity}
                      </span>

                      {/* ── PLUS BUTTON — disabled at max stock ───────────
                          Seller cannot order more than what is in stock
                          Visual cues: grey colour + not-allowed cursor + tooltip */}
                      <button
                        onClick={() =>
                          updateQty(item.product_variant_id, 1, item.stock)
                        }
                        disabled={atMaxStock}
                        title={
                          atMaxStock
                            ? `Only ${item.stock} in stock`
                            : `Add one more`
                        }
                        className={`w-6 h-6 rounded border flex items-center
                          justify-center transition-colors
                          ${
                            atMaxStock
                              ? "border-muted bg-muted text-muted-foreground/40 cursor-not-allowed"
                              : "border-border hover:bg-muted cursor-pointer"
                          }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── STOCK WARNING under the item ──────────────────────
                    Only shows when seller has reached the stock limit
                    Written in plain language — no technical terms */}
                {atMaxStock && (
                  <p
                    className="text-xs text-amber-600 dark:text-amber-400
                                mt-1 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    Only {item.stock} available in stock — cannot add more
                  </p>
                )}
              </div>
            );
          })}

          <div className="border-t border-border pt-2 flex justify-between">
            <span className="text-sm font-medium">Subtotal</span>
            <span className="text-sm font-bold tabular-nums">
              ৳
              {items
                .reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
                .toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Product search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2
                           w-4 h-4 text-muted-foreground"
        />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-muted/40">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Base price: ৳{Number(product.base_price).toLocaleString()}
                </p>
              </div>
              <div className="divide-y divide-border">
                {product.variants?.map((variant) => {
                  const inOrder = items.find(
                    (i) => i.product_variant_id === variant.id,
                  );
                  const stock = variant.inventory?.quantity || 0;
                  const isLow = stock > 0 && stock <= 5;
                  const isOut = stock === 0;

                  // ── AT MAX STOCK CHECK for variant row ──────────────
                  // If this variant is already in the order at max qty
                  // disable the + and the Add button
                  const atMaxStock = inOrder && inOrder.quantity >= stock;

                  return (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm">
                          {[variant.color, variant.size]
                            .filter(Boolean)
                            .join(" · ") || "Default"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            ৳
                            {Number(
                              variant.price || product.base_price,
                            ).toLocaleString()}
                          </p>
                          {/* Stock level indicator */}
                          <span
                            className={`text-xs font-medium
                            ${
                              isOut
                                ? "text-red-500"
                                : isLow
                                  ? "text-amber-500"
                                  : "text-green-600"
                            }`}
                          >
                            {isOut
                              ? "Out of stock"
                              : isLow
                                ? `Only ${stock} left`
                                : `${stock} in stock`}
                          </span>
                        </div>
                      </div>

                      {inOrder ? (
                        // Quantity controls when item is in the order
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(variant.id, -1, stock)}
                            className="w-7 h-7 rounded border border-border flex
                                       items-center justify-center hover:bg-muted"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-sm font-medium w-6 text-center">
                            {inOrder.quantity}
                          </span>

                          {/* ── PLUS BUTTON — disabled when at max stock ──
                              Same logic as the summary above
                              Consistent behaviour across both places */}
                          <button
                            onClick={() => addItem(variant, product)}
                            disabled={isOut || atMaxStock}
                            title={
                              atMaxStock
                                ? `Only ${stock} in stock — cannot add more`
                                : isOut
                                  ? "Out of stock"
                                  : "Add one more"
                            }
                            className={`w-7 h-7 rounded border flex
                              items-center justify-center transition-colors
                              ${
                                isOut || atMaxStock
                                  ? "border-muted bg-muted text-muted-foreground/40 cursor-not-allowed"
                                  : "border-border hover:bg-muted cursor-pointer"
                              }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        // Add button when item is not yet in the order
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          disabled={isOut}
                          onClick={() => addItem(variant, product)}
                        >
                          <Plus className="w-3 h-3" /> Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── STEP 3: PAYMENT & COURIER ────────────────────────────────────────────────

function PaymentStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold mb-1">Payment & Delivery</h2>
        <p className="text-sm text-muted-foreground">
          Set payment method, delivery charges and courier
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Delivery Charge (৳)</label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={data.delivery_charge}
            onChange={(e) => onChange("delivery_charge", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Discount (৳)</label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={data.discount}
            onChange={(e) => onChange("discount", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Payment Method</label>
          <select
            value={data.payment_method}
            onChange={(e) => onChange("payment_method", e.target.value)}
            className="w-full text-sm border border-border rounded-md px-3 py-2
                       bg-background text-foreground focus:outline-none
                       focus:ring-2 focus:ring-primary"
          >
            <option value="cash_on_delivery">Cash on Delivery</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="partial">Partial Payment</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Payment Status</label>
          <select
            value={data.payment_status}
            onChange={(e) => onChange("payment_status", e.target.value)}
            className="w-full text-sm border border-border rounded-md px-3 py-2
                       bg-background text-foreground focus:outline-none
                       focus:ring-2 focus:ring-primary"
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Courier</label>
          <select
            value={data.courier_name}
            onChange={(e) => onChange("courier_name", e.target.value)}
            className="w-full text-sm border border-border rounded-md px-3 py-2
                       bg-background text-foreground focus:outline-none
                       focus:ring-2 focus:ring-primary"
          >
            <option value="">Select courier</option>
            <option value="steadfast">SteadFast</option>
            <option value="pathao">Pathao</option>
            <option value="redx">Redx</option>
            <option value="paperfly">Paperfly</option>
            <option value="own">Own Delivery</option>
            <option value="manual">Manual Entry</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Order Source</label>
          <select
            value={data.source_channel}
            onChange={(e) => onChange("source_channel", e.target.value)}
            className="w-full text-sm border border-border rounded-md px-3 py-2
                       bg-background text-foreground focus:outline-none
                       focus:ring-2 focus:ring-primary"
          >
            <option value="manual">Manual</option>
            <option value="facebook">Facebook Page</option>
            <option value="messenger">Messenger</option>
            <option value="instagram">Instagram DM</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook_comment">Facebook Comment</option>
          </select>
        </div>
      </div>

      {/* ── PAYMENT DETAILS — only for digital / partial payments ────────────
          bKash and Nagad customers send a transaction ID (TrxID).
          Partial payments need the amount actually paid so the courier
          knows how much cash to still collect on delivery. */}
      {["bkash", "nagad", "partial"].includes(data.payment_method) && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4
                        border border-border rounded-lg bg-muted/20"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Transaction ID{" "}
              <span className="text-muted-foreground font-normal">
                ({data.payment_method === "nagad" ? "Nagad" : "bKash"} TrxID)
              </span>
            </label>
            <Input
              name="payment_reference"
              placeholder="e.g. 9Xk2Lm8pQr"
              value={data.payment_reference}
              onChange={(e) => onChange("payment_reference", e.target.value)}
            />
          </div>
          {(data.payment_status === "partial" ||
            data.payment_method === "partial") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount Paid (৳)</label>
              <Input
                type="number"
                min="0"
                placeholder="Advance amount received"
                value={data.paid_amount}
                onChange={(e) => onChange("paid_amount", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Remaining will be collected as cash on delivery
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className="flex items-center gap-3 p-4 border border-border
                      rounded-lg bg-muted/20"
      >
        <input
          type="checkbox"
          id="preorder"
          checked={data.is_preorder}
          onChange={(e) => onChange("is_preorder", e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <div>
          <label
            htmlFor="preorder"
            className="text-sm font-medium cursor-pointer"
          >
            Mark as Pre-order
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inventory will NOT be deducted for pre-orders
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Order Notes (optional)</label>
        <textarea
          placeholder="Any special instructions..."
          value={data.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={3}
          className="w-full text-sm border border-border rounded-md px-3 py-2
                     bg-background text-foreground focus:outline-none
                     focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
    </div>
  );
}

// ─── STEP 4: CONFIRM ORDER ────────────────────────────────────────────────────

function ConfirmStep({ customer, items, payment }) {
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const deliveryCharge = Number(payment.delivery_charge) || 0;
  const discount = Number(payment.discount) || 0;
  const total = subtotal + deliveryCharge - discount;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold mb-1">Confirm Order</h2>
        <p className="text-sm text-muted-foreground">
          Review everything before submitting
        </p>
      </div>

      <div className="bg-muted/40 rounded-lg p-4 space-y-1">
        <p
          className="text-xs font-medium text-muted-foreground uppercase
                      tracking-wider mb-2"
        >
          Customer
        </p>
        <p className="text-sm font-semibold">{customer?.name}</p>
        <p className="text-xs text-muted-foreground">{customer?.phone}</p>
        {customer?.delivery_address && (
          <p className="text-xs text-muted-foreground">
            {customer.delivery_address}
          </p>
        )}
      </div>

      <div className="bg-muted/40 rounded-lg p-4">
        <p
          className="text-xs font-medium text-muted-foreground uppercase
                      tracking-wider mb-3"
        >
          Items
        </p>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.product_variant_id}
              className="flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium">{item.productName}</p>
                {item.variantLabel && (
                  <p className="text-xs text-muted-foreground">
                    {item.variantLabel} · Qty: {item.quantity}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold tabular-nums">
                ৳{(item.unit_price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg p-4 space-y-2">
        <p
          className="text-xs font-medium text-muted-foreground uppercase
                      tracking-wider mb-3"
        >
          Price Breakdown
        </p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>৳{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span>৳{deliveryCharge.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-green-600">
              -৳{discount.toLocaleString()}
            </span>
          </div>
        )}
        <div
          className="flex justify-between text-base font-bold
                        border-t border-border pt-2 mt-2"
        >
          <span>Total</span>
          <span>৳{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Payment</p>
          <p className="text-sm font-medium capitalize">
            {payment.payment_method?.replace("_", " ")}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {payment.payment_status}
          </p>
        </div>
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Courier</p>
          <p className="text-sm font-medium capitalize">
            {payment.courier_name || "Not set"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {payment.source_channel}
          </p>
        </div>
      </div>

      {payment.is_preorder && (
        <div
          className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950
                        text-amber-800 dark:text-amber-200 rounded-lg px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">
            This is a pre-order. Inventory will not be deducted.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN NEW ORDER PAGE ──────────────────────────────────────────────────────

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  // Prefill data passed from the Messenger inbox "Create Order" button.
  // Contains { name, source_channel, conversation_id } when present.
  const prefill = location.state?.prefill || null;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [payment, setPayment] = useState({
    delivery_charge: 80,
    discount: 0,
    payment_method: "cash_on_delivery",
    payment_status: "unpaid",
    payment_reference: "",
    paid_amount: "",
    courier_name: "steadfast",
    source_channel: "manual",
    is_preorder: false,
    notes: "",
  });

  const updatePayment = (field, value) => {
    setPayment((prev) => ({ ...prev, [field]: value }));
  };

  const canNext = () => {
    if (step === 1) return !!customer;
    if (step === 2) return items.length > 0;
    if (step === 3) return true;
    return false;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/orders", {
        customer_id: customer.id,

        // ── SEND ALL ITEM FIELDS THE BACKEND NEEDS ─────────────────────
        items: items.map((i) => ({
          product_variant_id: i.product_variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          // unit_price is stored on the item when seller adds it in ProductStep
          subtotal: i.unit_price * i.quantity,
          // subtotal calculated here — price × quantity
        })),

        delivery_charge: payment.delivery_charge,
        discount: payment.discount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        payment_reference: payment.payment_reference || null,
        paid_amount: Number(payment.paid_amount) || 0,
        courier_name: payment.courier_name,
        source_channel: payment.source_channel,
        is_preorder: payment.is_preorder,
        notes: payment.notes,
      });
      navigate("/orders");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message || "";
      if (errors) {
        setError(Object.values(errors)[0][0]);
      } else if (
        message.toLowerCase().includes("stock") ||
        message.toLowerCase().includes("inventory")
      ) {
        setError(message);
      } else {
        setError(
          "Could not create the order. Please check your details and try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          New Order
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Create a new order step by step
        </p>
      </div>

      <StepIndicator currentStep={step} />

      <Card>
        <CardContent className="p-5 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <CustomerStep
                  selected={customer}
                  onSelect={setCustomer}
                  prefill={prefill}
                />
              )}
              {step === 2 && (
                <ProductStep items={items} onItemsChange={setItems} />
              )}
              {step === 3 && (
                <PaymentStep data={payment} onChange={updatePayment} />
              )}
              {step === 4 && (
                <ConfirmStep
                  customer={customer}
                  items={items}
                  payment={payment}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ── ERROR MESSAGE ─────────────────────────────────────────────────
          Written for sellers — no SQL, no HTTP codes, no technical terms */}
      {error && (
        <div
          className="flex items-start gap-3 bg-red-50 dark:bg-red-950
                        border border-red-200 dark:border-red-800
                        rounded-lg px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Could not create order
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() =>
            step === 1 ? navigate("/orders") : setStep((s) => s - 1)
          }
          className="gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="gap-1.5"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5 min-w-32"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Create Order
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
