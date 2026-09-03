"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Star, X, ImageOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { cldThumb, type Photo } from "@/lib/photos";
import { addPropertyPhotos, removePropertyPhoto, setCoverPhoto } from "./actions";

const MAX = 20;
const MAX_MB = 10;

export function PhotoUploader({
  propertyId,
  photos,
  configured,
}: {
  propertyId: string;
  photos: Photo[];
  configured: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  const [pending, start] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (!configured) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-ink-300 bg-ink-50 p-4 text-sm text-ink-500">
        <ImageOff className="h-5 w-5 shrink-0" />
        Photo uploads aren&apos;t set up. Add <code className="rounded bg-ink-100 px-1">CLOUDINARY_*</code> env vars
        (see README §7) and redeploy.
      </div>
    );
  }

  async function onFiles(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    if (photos.length + list.length > MAX) {
      toast("error", `Max ${MAX} photos per property`);
      return;
    }
    const tooBig = list.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) {
      toast("error", `"${tooBig.name}" is over ${MAX_MB} MB`);
      return;
    }

    setBusy(true);
    try {
      const sigRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!sigRes.ok) throw new Error("Could not start upload");
      const sig = await sigRes.json();

      const uploaded: Photo[] = [];
      for (const file of list) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sig.apiKey);
        form.append("timestamp", String(sig.timestamp));
        form.append("folder", sig.folder);
        form.append("signature", sig.signature);

        const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok || !data.secure_url) {
          throw new Error(data?.error?.message || `Upload failed for ${file.name}`);
        }
        uploaded.push({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
        });
      }

      const r = await addPropertyPhotos(propertyId, uploaded);
      toast(r.ok ? "success" : "error", r.message ?? "Done");
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const act = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      toast(r.ok ? "success" : "error", r.message ?? "Done");
      router.refresh();
    });

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p, i) => (
          <div key={p.publicId} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cldThumb(p.url)} alt="" className="h-full w-full object-cover" loading="lazy" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Cover
              </span>
            )}
            <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-ink-950/50 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
              {i !== 0 ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act(() => setCoverPhoto(propertyId, p.publicId))}
                  className="rounded bg-white/90 p-1 text-ink-700 hover:bg-white"
                  title="Set as cover"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => act(() => removePropertyPhoto(propertyId, p.publicId))}
                className="rounded bg-white/90 p-1 text-red-600 hover:bg-white"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          disabled={busy || photos.length >= MAX}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-300 text-sm text-ink-500 transition hover:border-brand-400 hover:bg-brand-50/40",
            (busy || photos.length >= MAX) && "cursor-not-allowed opacity-60",
          )}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          {busy ? "Uploading…" : photos.length >= MAX ? "Limit reached" : "Add photos"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-ink-400">
        JPG / PNG / WebP up to {MAX_MB} MB. First photo is the cover. {photos.length}/{MAX} used.
      </p>
    </div>
  );
}
