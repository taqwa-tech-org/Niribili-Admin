import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Today's date as `YYYY-MM-DD` in the user's local timezone.
 *
 * NB: do NOT use `new Date().toISOString().split("T")[0]` for this — that
 * returns the UTC date, which is wrong for any user east/west of UTC after
 * midnight. In Bangladesh (UTC+6) at 1 AM, UTC is still the previous day, so
 * the report would default to yesterday.
 */
export function todayLocalIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format a `YYYY-MM-DD` date string as `09-May-2026`.
 * Returns the input unchanged if it doesn't match the expected pattern.
 */
export function formatDatePretty(dateStr: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
  if (!m) return dateStr;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [, y, mo, d] = m;
  return `${d}-${months[Number(mo) - 1]}-${y}`;
}
