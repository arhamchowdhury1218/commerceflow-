// Reusable status badge used in Orders table and Order detail modal
// Pass either orderStatus or paymentStatus config

export const orderStatusConfig = {
  pending: {
    label: "Pending",
    color:
      "bg-amber-100  text-amber-800  dark:bg-amber-900  dark:text-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    color:
      "bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200",
  },
  packed: {
    label: "Packed",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  shipped: {
    label: "Shipped",
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

export const paymentStatusConfig = {
  unpaid: {
    label: "Unpaid",
    color: "bg-red-100   text-red-800   dark:bg-red-900   dark:text-red-200",
  },
  partial: {
    label: "Partial",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
};

export default function StatusBadge({ status, config }) {
  const cfg = config[status];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full
      text-xs font-medium whitespace-nowrap ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}
