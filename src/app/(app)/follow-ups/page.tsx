import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFollowUps } from "@/features/followups/queries";
import type { SearchParams } from "@/lib/pagination";
import { PageHeader, EmptyState, Avatar } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { TabLinks } from "@/components/ui/tabs";
import { Badge, temperatureTone } from "@/components/ui/badge";
import { FilterSelect } from "@/components/ui/query-controls";
import { CompleteFollowUpButton } from "@/features/followups/complete-button";
import { FOLLOWUP_TYPES } from "@/lib/constants";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { PhoneCall, CheckCircle2 } from "lucide-react";

export default async function FollowUpsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const { tab, rows, counts } = await getFollowUps(user, sp);
  const team = user.role === "SALES" ? [] : await db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });

  const tabs = [
    { key: "today", label: "Today", href: "/follow-ups?tab=today", count: counts.today },
    { key: "overdue", label: "Overdue", href: "/follow-ups?tab=overdue", count: counts.overdue, tone: "danger" as const },
    { key: "upcoming", label: "Upcoming", href: "/follow-ups?tab=upcoming", count: counts.upcoming },
    { key: "completed", label: "Completed", href: "/follow-ups?tab=completed", count: counts.completed },
  ];

  return (
    <>
      <PageHeader title="Follow-ups" subtitle="Stay on top of every commitment. Overdue items need action first." />

      <div className="mb-4">
        <TabLinks tabs={tabs} active={tab} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterSelect name="type" label="Type" options={FOLLOWUP_TYPES} />
        {team.length > 0 && (
          <FilterSelect name="assignedToId" label="Owner" options={team.map((t) => ({ value: t.id, label: t.name }))} />
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={tab === "completed" ? CheckCircle2 : PhoneCall}
          title={
            tab === "today"
              ? "Nothing due today"
              : tab === "overdue"
                ? "No overdue follow-ups — nicely done"
                : tab === "upcoming"
                  ? "No upcoming follow-ups scheduled"
                  : "No completed follow-ups yet"
          }
          description={tab !== "completed" ? "Open a lead to schedule the next touchpoint." : undefined}
        />
      ) : (
        <Card className="divide-y divide-ink-100">
          {rows.map((f) => {
            const overdue = f.status === "Pending" && new Date(f.dueAt) < new Date();
            return (
              <div key={f.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/leads/${f.lead.id}`} className="font-medium text-ink-900 hover:text-brand-700">
                      {f.lead.fullName}
                    </Link>
                    <Badge tone={temperatureTone(f.lead.temperature)} dot>
                      {f.lead.temperature}
                    </Badge>
                    <span className="text-xs text-ink-400">{f.lead.code}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-600">
                    <span className="font-medium">{f.type}</span>
                    {f.purpose ? ` · ${f.purpose}` : ""}
                    {f.outcome ? ` — ${f.outcome}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <p className={overdue ? "font-semibold text-red-600" : "text-ink-600"}>
                      {formatDateTime(f.dueAt)}
                    </p>
                    <p className="text-ink-400">
                      {f.status === "Pending" ? relativeTime(f.dueAt) : `Done ${relativeTime(f.completedAt ?? f.dueAt)}`}
                    </p>
                  </div>
                  {f.assignedTo && <Avatar name={f.assignedTo.name} color={f.assignedTo.avatarColor} size={24} />}
                  {f.status === "Pending" ? (
                    <CompleteFollowUpButton followUpId={f.id} />
                  ) : (
                    <Badge tone={f.status === "Completed" ? "emerald" : "slate"}>{f.status}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}
