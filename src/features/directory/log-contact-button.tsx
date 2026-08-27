"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { logOwnerContact } from "./actions";

export function LogContactButton({ ownerId }: { ownerId: string }) {
  const [pending, start] = React.useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await logOwnerContact(ownerId);
          toast(r.ok ? "success" : "error", r.message ?? "Done");
          router.refresh();
        })
      }
    >
      <PhoneCall className="h-4 w-4" /> Log contact
    </Button>
  );
}
