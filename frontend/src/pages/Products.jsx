import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, AlertCircle, RefreshCw, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import SearchBar from "@/components/shared/SearchBar";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ProductCard from "@/components/products/ProductCard";
import AddProductModal from "@/components/products/AddProductModal";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";
import useProducts from "@/hooks/useProducts";

export default function Products() {
  const { products, loading, fetchProducts, deleteProduct, toggleStatus } =
    useProducts();

  // confirm is the function we pass down to ProductCard → deleteProduct
  // ConfirmDialogComponent is the actual dialog rendered in JSX below
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = products.filter((p) => {
    const matchesSearch =
      search === "" || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const outOfStockProducts = products.filter((p) =>
    p.variants?.some((v) => (v.inventory?.quantity || 0) === 0),
  );

  const lowStockProducts = products.filter((p) =>
    p.variants?.some((v) => {
      const qty = v.inventory?.quantity || 0;
      return qty > 0 && qty <= (v.inventory?.low_stock_threshold || 5);
    }),
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Products"
        description={`${products.length} products · manage your catalog and stock`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProducts}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </PageHeader>

      {outOfStockProducts.length > 0 && (
        <div
          className="flex items-center gap-2 bg-red-50 dark:bg-red-950
                        border border-red-200 dark:border-red-800
                        text-red-700 dark:text-red-300 rounded-lg px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium">
            {outOfStockProducts.length} product
            {outOfStockProducts.length > 1 ? "s have" : " has"} out of stock
            variants
          </p>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div
          className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950
                        border border-amber-200 dark:border-amber-800
                        text-amber-700 dark:text-amber-300 rounded-lg px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium">
            {lowStockProducts.length} product
            {lowStockProducts.length > 1 ? "s are" : " is"} running low on stock
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
        />
        <div className="flex gap-1.5">
          {["all", "active", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium
                transition-colors capitalize
                ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading products..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "No products match your search" : "No products yet"}
          description={
            !search ? "Add your first product to get started" : undefined
          }
          action={
            !search && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setShowModal(true)}
              >
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              // Pass confirm down so ProductCard can trigger the dialog
              onDelete={(id) => deleteProduct(id, confirm)}
              onToggleStatus={toggleStatus}
              onSuccess={fetchProducts}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <AddProductModal
            onClose={() => setShowModal(false)}
            onSuccess={fetchProducts}
          />
        )}
      </AnimatePresence>

      {/* The confirm dialog — renders as a portal overlay when triggered */}
      {ConfirmDialogComponent}
    </div>
  );
}
