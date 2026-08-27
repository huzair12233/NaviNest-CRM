"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

type Hit = { type: string; label: string; sub: string; href: string };

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [hits, setHits] = React.useState<Hit[]>([]);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  React.useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setHits(data.hits ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  const grouped = hits.reduce<Record<string, Hit[]>>((acc, h) => {
    (acc[h.type] ??= []).push(h);
    return acc;
  }, {});

  return (
    <div ref={boxRef} className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search leads, properties, owners, deals…"
        className="h-9 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:bg-white"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-96 overflow-y-auto scroll-thin rounded-lg border border-ink-200 bg-white p-1.5 shadow-pop animate-fade-in">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-ink-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {!loading && hits.length === 0 && (
            <p className="px-3 py-3 text-sm text-ink-400">No matches for “{q}”.</p>
          )}
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="mb-1">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {type}
              </p>
              {items.map((h, i) => (
                <button
                  key={i}
                  onClick={() => go(h.href)}
                  className="flex w-full flex-col rounded-md px-2 py-1.5 text-left hover:bg-brand-50"
                >
                  <span className="text-sm font-medium text-ink-800">{h.label}</span>
                  <span className="text-xs text-ink-400">{h.sub}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
