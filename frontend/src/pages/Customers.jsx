import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import SearchBar from "@/components/shared/SearchBar";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import CustomerCard from "@/components/customers/CustomerCard";
import AddCustomerModal from "@/components/customers/AddCustomerModal";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import useCustomers from "@/hooks/useCustomers";
import api from "@/lib/api";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function Customers() {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { customers, loading, fetchCustomers, deleteCustomer } = useCustomers();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // When viewing a customer, fetch their full order history
  const handleViewCustomer = async (customer) => {
    try {
      const res = await api.get(`/customers/${customer.id}`);
      setSelectedCustomer(res.data);
    } catch (err) {
      console.error(err);
      setSelectedCustomer(customer);
      // Fallback to basic data if fetch fails
    }
  };

  const filtered = customers.filter(
    (c) =>
      search === "" ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

  // Source channel filter counts for summary
  const totalOrders = customers.reduce(
    (sum, c) => sum + (c.orders_count || 0),
    0,
  );

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete Customer",
      description: "This will remove the customer and all their data.",
      confirmText: "Delete Customer",
      type: "danger",
    });
    if (!ok) return;
    await deleteCustomer(id);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Customers"
        description={`${customers.length} customers · ${totalOrders} total orders`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomers}
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
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </PageHeader>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, phone or email..."
      />

      {loading ? (
        <LoadingSpinner text="Loading customers..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No customers match your search" : "No customers yet"}
          description={
            !search ? "Add your first customer to get started" : undefined
          }
          action={
            !search && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4" /> Add Customer
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer, index) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              index={index}
              onDelete={handleDelete}
              onView={handleViewCustomer}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddCustomerModal
            onClose={() => setShowAddModal(false)}
            onSuccess={fetchCustomers}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </AnimatePresence>
      {ConfirmDialogComponent}
    </div>
  );
}
