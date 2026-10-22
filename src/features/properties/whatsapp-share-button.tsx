"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPropertyShareMessage, waLink } from "@/lib/whatsapp";
import { shareProperty } from "@/features/leads/actions";

type ShareableProperty = Parameters<typeof buildPropertyShareMessage>[0];

export function WhatsAppShareButton({
  property,
  propertyId,
  phone,
  leadId,
  score,
  size = "sm",
  label = "WhatsApp",
}: {
  property: ShareableProperty;
  /** Property id — required only when logging a share against a lead. */
  propertyId?: string;
  /** Recipient's number. Omit to let WhatsApp's own contact picker choose. */
  phone?: string | null;
  /** When sharing to a specific lead, also logs it on that lead's timeline. */
  leadId?: string;
  score?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const [, start] = React.useTransition();
  const router = useRouter();

  return (
    <a
      href={waLink(phone, buildPropertyShareMessage(property))}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        if (leadId && propertyId) {
          start(async () => {
            await shareProperty(leadId, propertyId, score).catch(() => {});
            router.refresh();
          });
        }
      }}
    >
      <Button size={size} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
        <MessageCircle className="h-3.5 w-3.5" /> {label}
      </Button>
    </a>
  );
}
