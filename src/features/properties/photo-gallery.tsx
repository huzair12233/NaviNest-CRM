"use client";

import * as React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cldThumb, cldFull, type Photo } from "@/lib/photos";

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  const [cover, ...rest] = photos;

  return (
    <>
      <div className="grid gap-1.5 sm:grid-cols-[2fr_1fr]">
        <button onClick={() => setOpen(0)} className="overflow-hidden rounded-l-xl sm:rounded-l-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cldThumb(cover.url, 900, 600)} alt="" className="h-64 w-full object-cover transition hover:opacity-95 sm:h-80" />
        </button>
        <div className="hidden grid-rows-2 gap-1.5 sm:grid">
          {rest.slice(0, 2).map((p, i) => (
            <button key={p.publicId} onClick={() => setOpen(i + 1)} className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cldThumb(p.url, 500, 300)} alt="" className="h-full w-full object-cover transition hover:opacity-95" />
              {i === 1 && photos.length > 3 && (
                <span className="absolute inset-0 grid place-items-center bg-ink-950/50 text-sm font-semibold text-white">
                  +{photos.length - 3} more
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {photos.length > 1 && (
        <div className="mt-1.5 flex gap-1.5 overflow-x-auto scroll-thin sm:hidden">
          {photos.map((p, i) => (
            <button key={p.publicId} onClick={() => setOpen(i)} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cldThumb(p.url, 120, 90)} alt="" className="h-16 w-20 rounded object-cover" />
            </button>
          ))}
        </div>
      )}

      {open !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/90 p-4" onClick={() => setOpen(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen((i) => (i! - 1 + photos.length) % photos.length); }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen((i) => (i! + 1) % photos.length); }}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cldFull(photos[open].url)}
            alt=""
            className="max-h-[88vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-4 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {open + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}
