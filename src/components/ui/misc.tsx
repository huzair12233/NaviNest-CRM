import Link from "next/link";
import { cn, initials } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumb && (
          <nav className="mb-1 flex items-center gap-1.5 text-xs text-ink-400">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {b.href ? (
                  <Link href={b.href} className="hover:text-ink-700">
                    {b.label}
                  </Link>
                ) : (
                  <span>{b.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white/50 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="text-sm font-medium text-ink-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({
  name,
  color,
  size = 28,
  className,
}: {
  name?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color || "#0f766e",
        fontSize: size * 0.4,
      }}
      title={name || undefined}
    >
      {initials(name)}
    </span>
  );
}

export function StatRow({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      {items.map((it, i) => (
        <div key={i}>
          <dt className="text-xs text-ink-500">{it.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink-900">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="my-4 border-ink-100" />;
  return (
    <div className="my-4 flex items-center gap-3">
      <hr className="flex-1 border-ink-100" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</span>
      <hr className="flex-1 border-ink-100" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
