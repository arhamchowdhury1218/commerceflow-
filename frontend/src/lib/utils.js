import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── ORDER ID DISPLAY + SEARCH ──────────────────────────────────────────────
// Orders are stored with a plain numeric id (e.g. 23) but shown to sellers
// as "#CF-0023". Sellers search using what they SEE, so search must match
// all natural formats: "23", "0023", "CF-0023", "#CF-0023", "cf-23".

// Format a numeric id the way it's displayed in the UI: "CF-0023"
export function formatOrderId(id) {
  return `CF-${String(id).padStart(4, "0")}`;
}

// Does this order id match what the seller typed? Handles every format.
// Pass the raw numeric id and the raw search string.
export function orderIdMatches(id, rawSearch) {
  const search = String(rawSearch || "")
    .trim()
    .toLowerCase();
  if (search === "") return true;

  const idNumber = String(id); // "23"
  const idPadded = String(id).padStart(4, "0"); // "0023"
  const idFull = `cf-${idPadded}`; // "cf-0023"

  // Strip "#", spaces, "cf-" prefix and leading zeros from the search
  // so "cf-0023" / "#0023" / "0023" all reduce to "23"
  const numericSearch = search
    .replace(/[#\s]/g, "")
    .replace(/^cf-?/, "")
    .replace(/^0+/, "");

  return (
    (numericSearch !== "" && idNumber.includes(numericSearch)) ||
    idPadded.includes(search) ||
    idFull.includes(search)
  );
}
