// Delivery-specific status badge
// Different colors from order status badge

const deliveryStatusConfig = {
  pending: {
    label: "Pending",
    color:
      "bg-amber-100  text-amber-800  dark:bg-amber-900  dark:text-amber-200",
  },
  picked_up: {
    label: "Picked Up",
    color:
      "bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200",
  },
  in_transit: {
    label: "In Transit",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  },
  delivered: {
    label: "Delivered",
    color:
      "bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-200",
  },
  returned: {
    label: "Returned",
    color: "bg-red-100    text-red-800    dark:bg-red-900    dark:text-red-200",
  },
  cancelled: {
    label: "Cancelled",
    color:
      "bg-gray-100   text-gray-700   dark:bg-gray-800   dark:text-gray-300",
  },
};

export default function DeliveryStatusBadge({ status }) {
  const cfg = deliveryStatusConfig[status] || deliveryStatusConfig.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full
      text-xs font-medium whitespace-nowrap ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}
