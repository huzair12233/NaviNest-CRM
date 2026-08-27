import { cn } from "@/lib/utils";
import { LEAD_STATUS_GROUP } from "@/lib/constants";

type Tone =
  | "slate"
  | "emerald"
  | "blue"
  | "amber"
  | "red"
  | "violet"
  | "gold"
  | "brand";

const tones: Record<Tone, string> = {
  slate: "bg-ink-100 text-ink-700 ring-ink-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  gold: "bg-gold-50 text-gold-600 ring-gold-100",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
};

export function Badge({
  children,
  tone = "slate",
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  const g = LEAD_STATUS_GROUP[status];
  if (g === "won") return "emerald";
  if (g === "lost") return "red";
  if (g === "parked") return "violet";
  if (["Negotiation", "Token / Booking"].includes(status)) return "gold";
  if (status.startsWith("Site Visit")) return "blue";
  return "slate";
}

export function temperatureTone(t: string): Tone {
  return t === "Hot" ? "red" : t === "Warm" ? "amber" : "blue";
}

export function priorityTone(p: string): Tone {
  return p === "High" ? "red" : p === "Low" ? "slate" : "brand";
}

export function propertyStatusTone(s: string): Tone {
  return (
    {
      Available: "emerald",
      Hold: "amber",
      UnderNegotiation: "gold",
      Sold: "blue",
      Rented: "blue",
      Inactive: "slate",
    } as Record<string, Tone>
  )[s] ?? "slate";
}

export function dealStageTone(s: string): Tone {
  if (s === "Closed Won") return "emerald";
  if (s === "Closed Lost") return "red";
  if (["Token", "Booked"].includes(s)) return "gold";
  if (s === "Negotiation") return "amber";
  return "blue";
}

export function commissionTone(s: string): Tone {
  return s === "Received" ? "emerald" : s === "Partial" ? "amber" : "slate";
}
