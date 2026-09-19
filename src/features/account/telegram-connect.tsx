"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, Unlink, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { generateTelegramLink, disconnectTelegram } from "./actions";

export function TelegramConnect({ connected, configured }: { connected: boolean; configured: boolean }) {
  const [pending, start] = React.useTransition();
  const router = useRouter();
  const toast = useToast();

  if (!configured) {
    return (
      <p className="text-sm text-ink-500">
        Telegram isn&apos;t set up on the server yet — an admin needs to add{" "}
        <code className="rounded bg-ink-100 px-1">TELEGRAM_BOT_TOKEN</code> (see README).
      </p>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Connected
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await disconnectTelegram();
              toast(r.ok ? "success" : "error", r.message ?? "Done");
              router.refresh();
            })
          }
        >
          <Unlink className="h-4 w-4" /> Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await generateTelegramLink();
          if (!r.ok) {
            toast("error", r.message ?? "Could not generate link");
            return;
          }
          const link = r.data?.link as string;
          window.open(link, "_blank");
          toast("info", "Opened Telegram — tap Start in the chat to finish connecting.");
        })
      }
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Connect Telegram
    </Button>
  );
}
