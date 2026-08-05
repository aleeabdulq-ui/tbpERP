import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", options ?? { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMoney(value?: number | null, currency = "NGN") {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function relativeTime(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const divisions: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"], [60, "minute"], [24, "hour"], [7, "day"], [4.345, "week"], [12, "month"], [Number.POSITIVE_INFINITY, "year"],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let duration = seconds;
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) return rtf.format(Math.round(duration), unit);
    duration /= amount;
  }
  return rtf.format(Math.round(duration), "year");
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
}

export type Tone = "primary" | "success" | "warning" | "violet" | "danger";

export const toneBadge: Record<Tone, string> = {
  primary: "bg-accent-50 text-accent-700",
  success: "bg-success-50 text-success-500",
  warning: "bg-warning-50 text-warning-500",
  violet: "bg-violet-50 text-violet-500",
  danger: "bg-danger-50 text-danger-500",
};

export function labelize(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w|\s\w/g, (c) => c.toUpperCase());
}
