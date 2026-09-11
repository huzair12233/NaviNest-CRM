import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Indian currency: ₹1.25 Cr / ₹85 L / ₹45,000 */
export function inr(value?: number | null, opts: { compact?: boolean } = {}): string {
  if (value == null || Number.isNaN(value)) return "—";
  const compact = opts.compact ?? true;
  if (compact) {
    if (Math.abs(value) >= 1_00_00_000) {
      return `₹${trim(value / 1_00_00_000)} Cr`;
    }
    if (Math.abs(value) >= 1_00_000) {
      return `₹${trim(value / 1_00_000)} L`;
    }
  }
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(value))}`;
}

function trim(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, "");
}

export function inrRange(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${inr(min)} – ${inr(max)}`;
  return min != null ? `${inr(min)}+` : `Up to ${inr(max)}`;
}

/** The one headline figure for a property, based on its listing category. */
export function listingPrice(p: { listingType: string; salePrice?: number | null; rent?: number | null; deposit?: number | null }): string {
  if (p.listingType === "RENT") return `${inr(p.rent)}/mo`;
  if (p.listingType === "HEAVY_DEPOSIT") return `${inr(p.deposit)} deposit`;
  return inr(p.salePrice);
}

/** The one budget figure for a lead's requirement, based on its interest. */
export function leadBudget(l: { interest: string; budgetMin?: number | null; budgetMax?: number | null; rentMin?: number | null; rentMax?: number | null }): string {
  if (l.interest === "RENT") return inrRange(l.rentMin, l.rentMax);
  return inrRange(l.budgetMin, l.budgetMax);
}

export function formatDate(d?: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d?: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(d?: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(d?: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (mins < 60) return rtf.format(Math.sign(diff) * mins, "minute");
  if (hours < 24) return rtf.format(Math.sign(diff) * hours, "hour");
  if (days < 30) return rtf.format(Math.sign(diff) * days, "day");
  return rtf.format(Math.sign(diff) * Math.round(days / 30), "month");
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

export function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function startOfWeek(d = new Date()): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

export function startOfMonth(d = new Date()): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Normalise an Indian mobile number to last 10 digits for comparison. */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function isValidPhone(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizePhone(raw));
}

export function toArray(json: unknown): string[] {
  if (Array.isArray(json)) return json.map(String);
  if (typeof json === "string" && json.trim()) {
    try {
      const p = JSON.parse(json);
      return Array.isArray(p) ? p.map(String) : [json];
    } catch {
      return json.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function nextCode(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export function titleCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase());
}
