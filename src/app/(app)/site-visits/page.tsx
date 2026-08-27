import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteVisitScope } from "@/lib/rbac";
import type { SearchParams } from "@/lib/pagination";
import { getParam } from "@/lib/pagination";
import { startOfDay, endOfDay, formatDateTime, relativeTime } from "@/lib/utils";
import { PageHeader, EmptyState, Avatar } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { TabLinks } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SiteVisitFeedbackButton } from "@/features/sitevisits/feedback-button";
import { MapPin, Star } from "lucide-react";

const visitTone: Record<string, "blue" | "emerald" | "amber" | "red" | "slate"> = {
  Scheduled: "blue",
  Confirmed: "blue",
  Completed: "emerald",
  Rescheduled: "amber",
  Cancelled: "red",
  NoShow: "red",
};

export default async function SiteVisitsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const tab = getParam(sp, "tab") ?? "upcoming";
  const scope = siteVisitScope(user);

  const filters: Record<string, Prisma.SiteVisitWhereInput> = {
    today: { status: { in: ["Scheduled", "Confirmed"] }, scheduledAt: { gte: startOfDay(), lte: endOfDay() } },
    upcoming: { status: { in: ["Scheduled", "Confirmed", "Rescheduled"] }, scheduledAt: { gte: startOfDay() } },
    completed: { status: "Completed" },
    all: {},
  };

  const [rows, counts] = await Promise.all([
    db.siteVisit.findMany({
      where: { AND: [scope, filters[tab] ?? {}] },
      orderBy: { scheduledAt: tab === "completed" || tab === "all" ? "desc" : "asc" },
      take: 200,
      include: {
        lead: { select: { id: true, code: true, fullName: true, phone: true } },
        property: { select: { id: true, code: true, title: true, location: true } },
        assignedTo: { select: { name: true, avatarColor: true } },
      },
    }),
    Promise.all(
      ["today", "upcoming", "completed"].map((t) => db.siteVisit.count({ where: { AND: [scope, filters[t]] } })),
    ),
  ]);

  const tabs = [
    { key: "today", label: "Today", href: "/site-visits?tab=today", count: counts[0] },
    { key: "upcoming", label: "Upcoming", href: "/site-visits?tab=upcoming", count: counts[1] },
    { key: "completed", label: "Completed", href: "/site-visits?tab=completed", count: counts[2] },
    { key: "all", label: "All", href: "/site-visits?tab=all" },
  ];

  return (
    <>
      <PageHeader title="Site Visits" subtitle="Every scheduled visit, with feedback captured against the lead." />
      <div className="mb-4">
        <TabLinks tabs={tabs} active={tab} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={MapPin} title="No site visits here" description="Schedule a visit from a lead's page." />
      ) : (
        <Card className="divide-y divide-ink-100">
          {rows.map((v) => (
            <div key={v.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/leads/${v.lead.id}`} className="font-medium text-ink-900 hover:text-brand-700">
                    {v.lead.fullName}
                  </Link>
                  <Badge tone={visitTone[v.status] ?? "slate"}>{v.status}</Badge>
                  {v.interested && (
                    <Badge tone={v.interested === "Yes" ? "emerald" : v.interested === "No" ? "red" : "amber"}>
                      Interested: {v.interested}
                    </Badge>
                  )}
                  {v.rating != null && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-gold-600">
                      <Star className="h-3.5 w-3.5 fill-current" /> {v.rating}/5
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-600">
                  {v.property ? (
                    <Link href={`/properties/${v.property.id}`} className="hover:text-brand-700">
                      {v.property.title}
                    </Link>
                  ) : (
                    "Property TBD"
                  )}
                  {v.location ? ` · ${v.location}` : ""}
                </p>
                {v.liked && <p className="mt-1 text-xs text-ink-400">Liked: {v.liked}</p>}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <p className="font-medium text-ink-700">{formatDateTime(v.scheduledAt)}</p>
                  <p className="text-ink-400">{relativeTime(v.scheduledAt)}</p>
                </div>
                {v.assignedTo && <Avatar name={v.assignedTo.name} color={v.assignedTo.avatarColor} size={24} />}
                {["Scheduled", "Confirmed", "Rescheduled"].includes(v.status) && (
                  <SiteVisitFeedbackButton visitId={v.id} />
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
