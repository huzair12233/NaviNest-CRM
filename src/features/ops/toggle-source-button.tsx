"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { toggleLeadSource } from "./actions";

export function ToggleSourceButton({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = React.useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleLeadSource(id);
          toast(r.ok ? "success" : "error", r.message ?? "Done");
          router.refresh();
        })
      }
    >
      {active ? "Disable" : "Enable"}
    </Button>
  );
}
