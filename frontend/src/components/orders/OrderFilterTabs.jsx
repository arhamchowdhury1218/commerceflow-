// Filter tabs row: All / Pending / Confirmed / Shipped etc.
// Shows count badge on each tab

export default function OrderFilterTabs({ orders, activeFilter, onChange }) {
  // Count per status
  const counts = orders.reduce((acc, o) => {
    acc[o.order_status] = (acc[o.order_status] || 0) + 1;
    return acc;
  }, {});

  const tabs = [
    { value: "all", label: "All", count: orders.length },
    { value: "pending", label: "Pending", count: counts.pending || 0 },
    { value: "confirmed", label: "Confirmed", count: counts.confirmed || 0 },
    { value: "shipped", label: "Shipped", count: counts.shipped || 0 },
    { value: "delivered", label: "Delivered", count: counts.delivered || 0 },
    { value: "returned", label: "Returned", count: counts.returned || 0 },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0
            ${
              activeFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
        >
          {tab.label}
          <span
            className={`px-1.5 py-0.5 rounded-full text-xs
            ${
              activeFilter === tab.value
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-background text-foreground"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
