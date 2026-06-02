import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import SearchBar from "@/components/shared/SearchBar";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import OrderFilterTabs from "@/components/orders/OrderFilterTabs";
import OrdersTable from "@/components/orders/OrdersTable";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import useOrders from "@/hooks/useOrders";

export default function Orders() {
  const navigate = useNavigate();
  const { orders, loading, fetchOrders, updateOrderStatus } = useOrders();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      search === "" ||
      String(o.id).includes(search) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search);

    const matchesStatus =
      statusFilter === "all" || o.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader title="Orders" description={`${orders.length} total orders`}>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
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
          onClick={() => navigate("/orders/new")}
        >
          <Plus className="w-4 h-4" /> New Order
        </Button>
      </PageHeader>

      <OrderFilterTabs
        orders={orders}
        activeFilter={statusFilter}
        onChange={setStatusFilter}
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by order ID, customer name or phone..."
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner text="Loading orders..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={
                search || statusFilter !== "all"
                  ? "No orders match your search"
                  : "No orders yet"
              }
              description={
                !search && statusFilter === "all"
                  ? "Create your first order to get started"
                  : undefined
              }
              action={
                !search &&
                statusFilter === "all" && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate("/orders/new")}
                  >
                    <Plus className="w-4 h-4" /> New Order
                  </Button>
                )
              }
            />
          ) : (
            <OrdersTable orders={filtered} onViewOrder={setSelectedOrder} />
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={updateOrderStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
