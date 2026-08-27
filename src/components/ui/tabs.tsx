import Link from "next/link";
import { cn } from "@/lib/utils";

export function TabLinks({
  tabs,
  active,
}: {
  tabs: { key: string; label: string; href: string; count?: number; tone?: "danger" }[];
  active: string;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto scroll-thin border-b border-ink-200">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800",
            )}
          >
            {t.label}
            {t.count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  t.tone === "danger" && t.count > 0
                    ? "bg-red-100 text-red-700"
                    : isActive
                      ? "bg-brand-100 text-brand-700"
                      : "bg-ink-100 text-ink-500",
                )}
              >
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
