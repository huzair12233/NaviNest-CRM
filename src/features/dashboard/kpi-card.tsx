import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  href,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "danger" | "success" | "gold";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneCls = {
    default: "",
    warning: "ring-amber-200",
    danger: "ring-red-200",
    success: "ring-emerald-200",
    gold: "ring-gold-100",
  }[tone];
  const valueCls = {
    default: "text-ink-900",
    warning: "text-amber-700",
    danger: "text-red-600",
    success: "text-emerald-700",
    gold: "text-gold-600",
  }[tone];

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        {Icon ? (
          <Icon className="h-4 w-4 text-ink-300" />
        ) : href ? (
          <ArrowUpRight className="h-4 w-4 text-ink-300 transition group-hover:text-brand-600" />
        ) : null}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", valueCls)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </>
  );

  const cls = cn(
    "card group block p-4 ring-1 ring-transparent transition",
    toneCls,
    href && "hover:-translate-y-0.5 hover:shadow-pop",
  );

  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
