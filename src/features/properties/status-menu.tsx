"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PROPERTY_STATUSES } from "@/lib/constants";
import { setPropertyStatus } from "./actions";

export function PropertyStatusMenu({ id, current }: { id: string; current: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <div className="relative">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen((o) => !o)}>
        {current} <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-ink-200 bg-white p-1 shadow-pop">
            {PROPERTY_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setOpen(false);
                  start(async () => {
                    const r = await setPropertyStatus(id, s);
                    toast(r.ok ? "success" : "error", r.message ?? "Done");
                    router.refresh();
                  });
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-ink-100"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
