import { cn } from "@/lib/utils";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-full text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500">
      {children}
    </thead>
  );
}

export function TH({
  children,
  className,
  align,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "right" | "center";
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-2.5 font-medium",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-ink-100">{children}</tbody>;
}

export function TR({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <tr
      className={cn(
        "group transition-colors hover:bg-brand-50/40",
        href && "cursor-pointer",
        className,
      )}
      data-href={href}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  className,
  align,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-ink-700",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}
