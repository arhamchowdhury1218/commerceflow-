export default function StockBadge({ quantity, threshold = 5 }) {
  if (quantity === 0) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full
        text-xs font-medium bg-red-100 text-red-700
        dark:bg-red-900 dark:text-red-200"
      >
        Out of stock
      </span>
    );
  }
  if (quantity <= threshold) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full
        text-xs font-medium bg-amber-100 text-amber-700
        dark:bg-amber-900 dark:text-amber-200"
      >
        Low: {quantity} left
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full
      text-xs font-medium bg-green-100 text-green-700
      dark:bg-green-900 dark:text-green-200"
    >
      {quantity} in stock
    </span>
  );
}
