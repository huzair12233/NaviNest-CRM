"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { relativeTime, cn } from "@/lib/utils";
import { markNotificationRead, markAllNotificationsRead } from "./actions";

export function MarkAllReadButton() {
  const [pending, start] = React.useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await markAllNotificationsRead();
          toast("success", r.message ?? "Done");
          router.refresh();
        })
      }
    >
      <Check className="h-4 w-4" /> Mark all read
    </Button>
  );
}

export function NotificationItem({
  n,
}: {
  n: { id: string; title: string; body: string | null; link: string | null; readAt: Date | null; createdAt: string };
}) {
  const [pending, start] = React.useTransition();
  const router = useRouter();
  const read = !!n.readAt;

  const onOpen = () => {
    if (!read)
      start(async () => {
        await markNotificationRead(n.id);
        router.refresh();
      });
  };

  const content = (
    <div className={cn("flex items-start gap-3 px-5 py-3.5", !read && "bg-brand-50/40")}>
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", read ? "bg-transparent" : "bg-brand-600")} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", read ? "text-ink-600" : "font-medium text-ink-900")}>{n.title}</p>
        {n.body && <p className="text-xs text-ink-400">{n.body}</p>}
        <p className="mt-0.5 text-xs text-ink-400">{relativeTime(n.createdAt)}</p>
      </div>
      {pending && <span className="text-xs text-ink-400">…</span>}
    </div>
  );

  return n.link ? (
    <Link href={n.link} onClick={onOpen} className="block hover:bg-ink-50">
      {content}
    </Link>
  ) : (
    <button onClick={onOpen} className="block w-full text-left hover:bg-ink-50">
      {content}
    </button>
  );
}
