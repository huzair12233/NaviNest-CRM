"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

function useSetParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return React.useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (resetPage) next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, params],
  );
}

export function SearchBox({ placeholder = "Search…" }: { placeholder?: string }) {
  const params = useSearchParams();
  const setParams = useSetParams();
  const [value, setValue] = React.useState(params.get("q") ?? "");
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  const onChange = (v: string) => {
    setValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setParams({ q: v || null }), 350);
  };

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base pl-9 pr-8"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({
  name,
  label,
  options,
  allLabel = "All",
}: {
  name: string;
  label?: string;
  options: readonly (string | { value: string; label: string })[];
  allLabel?: string;
}) {
  const params = useSearchParams();
  const setParams = useSetParams();
  const value = params.get(name) ?? "";
  return (
    <select
      value={value}
      onChange={(e) => setParams({ [name]: e.target.value || null })}
      className={cn(
        "h-9 rounded-lg border border-ink-300 bg-white px-2.5 text-sm text-ink-700 outline-none focus:border-brand-500",
        value && "border-brand-400 bg-brand-50/50 text-brand-800",
      )}
    >
      <option value="">{label ? `${label}: ${allLabel}` : allLabel}</option>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function ClearFilters({ keys }: { keys: string[] }) {
  const params = useSearchParams();
  const setParams = useSetParams();
  const active = keys.some((k) => params.get(k));
  if (!active) return null;
  return (
    <button
      onClick={() => setParams(Object.fromEntries(keys.map((k) => [k, null])))}
      className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-800"
    >
      <X className="h-3.5 w-3.5" /> Clear
    </button>
  );
}

export function Pagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const setParams = useSetParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-ink-500">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => setParams({ page: String(page - 1) }, false)}
          className="rounded-md px-3 py-1.5 hover:bg-ink-100 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="px-2 text-xs">
          Page {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setParams({ page: String(page + 1) }, false)}
          className="rounded-md px-3 py-1.5 hover:bg-ink-100 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
