"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { setTaskStatus } from "./actions";
import { cn } from "@/lib/utils";

export function TaskCheckbox({ taskId, status }: { taskId: string; status: string }) {
  const [pending, start] = React.useTransition();
  const router = useRouter();
  const toast = useToast();
  const done = status === "Completed";
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await setTaskStatus(taskId, done ? "Pending" : "Completed");
          toast(r.ok ? "success" : "error", r.message ?? "Done");
          router.refresh();
        })
      }
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
        done ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300 hover:border-brand-500",
      )}
      aria-label={done ? "Mark incomplete" : "Mark complete"}
    >
      {done && (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.9a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

export function TaskStatusSelect({ taskId, status }: { taskId: string; status: string }) {
  const [pending, start] = React.useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <select
      disabled={pending}
      value={status}
      onChange={(e) =>
        start(async () => {
          const r = await setTaskStatus(taskId, e.target.value);
          toast(r.ok ? "success" : "error", r.message ?? "Done");
          router.refresh();
        })
      }
      className="h-8 rounded-md border border-ink-300 bg-white px-2 text-xs"
    >
      {["Pending", "InProgress", "Completed", "Cancelled"].map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
