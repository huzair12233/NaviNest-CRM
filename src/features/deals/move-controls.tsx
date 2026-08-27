"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { PIPELINE_STAGE_KEYS } from "@/lib/constants";
import { moveDealStage } from "./actions";

export function DealMoveControls({ dealId, stage }: { dealId: string; stage: string }) {
  const keys = PIPELINE_STAGE_KEYS as readonly string[];
  const idx = keys.indexOf(stage);
  const [pending, start] = React.useTransition();
  const toast = useToast();
  const router = useRouter();

  const move = (to: string) =>
    start(async () => {
      const r = await moveDealStage(dealId, to);
      toast(r.ok ? "success" : "error", r.message ?? "Done");
      router.refresh();
    });

  // linear stages 0..6 (Qualified..Booked), then Closed Won(7)/Lost(8)
  const prev = idx > 0 && idx <= 7 ? keys[idx - 1] : null;
  const next = idx < 6 ? keys[idx + 1] : idx === 6 ? "Closed Won" : null;

  return (
    <div className="flex items-center gap-1">
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />}
      <button
        disabled={!prev || pending}
        onClick={() => prev && move(prev)}
        className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30"
        title={prev ? `Back to ${prev}` : undefined}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        disabled={!next || pending}
        onClick={() => next && move(next)}
        className="rounded p-1 text-brand-600 hover:bg-brand-50 disabled:opacity-30"
        title={next ? `Advance to ${next}` : undefined}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
