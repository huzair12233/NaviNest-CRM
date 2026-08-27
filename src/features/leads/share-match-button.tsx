"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { shareProperty } from "./actions";

export function ShareMatchButton({
  leadId,
  propertyId,
  score,
  alreadyShared,
}: {
  leadId: string;
  propertyId: string;
  score: number;
  alreadyShared: boolean;
}) {
  const [pending, start] = React.useTransition();
  const [done, setDone] = React.useState(alreadyShared);
  const toast = useToast();
  const router = useRouter();

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <Check className="h-3.5 w-3.5" /> Shared
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await shareProperty(leadId, propertyId, score);
          if (r.ok) {
            setDone(true);
            toast("success", r.message ?? "Shared");
            router.refresh();
          } else {
            toast("error", r.message ?? "Failed");
          }
        })
      }
    >
      <Share2 className="h-3.5 w-3.5" /> Share
    </Button>
  );
}
