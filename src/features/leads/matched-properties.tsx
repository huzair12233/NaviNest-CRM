import Link from "next/link";
import type { Lead } from "@prisma/client";
import { db } from "@/lib/db";
import { matchProperties, matchBadge } from "@/lib/matching";
import { Badge } from "@/components/ui/badge";
import { listingPrice } from "@/lib/utils";
import { ShareMatchButton } from "./share-match-button";
import { EmptyState } from "@/components/ui/misc";
import { Building } from "lucide-react";

export async function MatchedProperties({ lead }: { lead: Lead }) {
  const listingType =
    lead.interest === "RENT" ? "RENT" : lead.interest === "HEAVY_DEPOSIT" ? "HEAVY_DEPOSIT" : "SALE";
  const candidates = await db.property.findMany({
    where: { listingType, status: { in: ["Available", "Hold"] } },
    take: 120,
  });
  const shared = await db.propertyInterest.findMany({
    where: { leadId: lead.id },
    select: { propertyId: true },
  });
  const sharedIds = new Set(shared.map((s) => s.propertyId));
  const matches = matchProperties(lead, candidates, 6);

  if (!matches.length) {
    return (
      <EmptyState
        icon={Building}
        title="No strong matches yet"
        description="Add budget, location and BHK to the requirement to see matched inventory."
      />
    );
  }

  return (
    <ul className="divide-y divide-ink-100">
      {matches.map(({ property: p, score, reasons }) => {
        const badge = matchBadge(score);
        return (
          <li key={p.id} className="flex items-center gap-3 py-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
              {score}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/properties/${p.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">
                {p.title}
              </Link>
              <p className="truncate text-xs text-ink-400">
                {p.code} · {p.location} · {listingPrice(p)}
                {reasons.length ? ` · ${reasons.slice(0, 2).join(", ")}` : ""}
              </p>
            </div>
            <Badge tone={badge.tone as "emerald"}>{badge.label}</Badge>
            <ShareMatchButton
              leadId={lead.id}
              propertyId={p.id}
              score={score}
              alreadyShared={sharedIds.has(p.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
