import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { RefreshCw, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import SearchBar from "@/components/shared/SearchBar";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import DeliveryCard from "@/components/deliveries/DeliveryCard";
import useDeliveries from "@/hooks/useDeliveries";

export default function Deliveries() {
  const { deliveries, loading, fetchDeliveries, syncDelivery, syncAll } =
    useDeliveries();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncAllMsg, setSyncAllMsg] = useState(null);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setSyncAllMsg(null);
    const result = await syncAll();
    setSyncAllMsg(
      result.success ? `${result.updated} deliveries updated` : "Sync failed",
    );
    setSyncingAll(false);
    setTimeout(() => setSyncAllMsg(null), 3000);
  };

  // Filter tabs
  const statusTabs = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in_transit", label: "In Transit" },
    { value: "delivered", label: "Delivered" },
    { value: "returned", label: "Returned" },
  ];

  // Count per status
  const counts = deliveries.reduce((acc, d) => {
    acc[d.delivery_status] = (acc[d.delivery_status] || 0) + 1;
    return acc;
  }, {});

  const filtered = deliveries.filter((d) => {
    const matchesSearch =
      search === "" ||
      d.order?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      String(d.order?.id).includes(search);

    const matchesStatus =
      statusFilter === "all" || d.delivery_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Active deliveries count (not delivered/returned/cancelled)
  const activeCount = deliveries.filter(
    (d) => !["delivered", "returned", "cancelled"].includes(d.delivery_status),
  ).length;

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Deliveries"
        description={`${deliveries.length} total · ${activeCount} active`}
      >
        {/* Sync all button */}
        <div className="flex items-center gap-2">
          {syncAllMsg && (
            <span
              className="text-xs font-medium text-green-600
                             dark:text-green-400"
            >
              {syncAllMsg}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncingAll || activeCount === 0}
            className="gap-1.5"
          >
            <RotateCcw
              className={`w-3.5 h-3.5
              ${syncingAll ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {syncingAll ? "Syncing..." : "Sync All"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeliveries}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5
              ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </PageHeader>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-xs font-medium whitespace-nowrap transition-colors
              flex-shrink-0
              ${
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab.label}
            {tab.value !== "all" && counts[tab.value] > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs
                ${
                  statusFilter === tab.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-foreground"
                }`}
              >
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by customer name, order ID or tracking number..."
      />

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading deliveries..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={
            search || statusFilter !== "all"
              ? "No deliveries match your search"
              : "No deliveries yet"
          }
          description={
            !search && statusFilter === "all"
              ? "Deliveries will appear here when you book SteadFast for an order"
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((delivery, index) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              index={index}
              onSync={syncDelivery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
