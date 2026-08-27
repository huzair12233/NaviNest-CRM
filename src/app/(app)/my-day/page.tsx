import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, formatDateTime, formatTime, relativeTime, inr } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, statusTone, temperatureTone, dealStageTone } from "@/components/ui/badge";
import { CompleteFollowUpButton } from "@/features/followups/complete-button";
import { SiteVisitFeedbackButton } from "@/features/sitevisits/feedback-button";
import { TaskCheckbox } from "@/features/ops/task-controls";
import {
  Flame,
  Sparkles,
  PhoneCall,
  AlertTriangle,
  MapPin,
  CheckSquare,
  Handshake,
} from "lucide-react";

export default async function MyDayPage() {
  const user = await requireUser();
  const now = new Date();
  const tStart = startOfDay();
  const tEnd = endOfDay();
  const mine = { assignedToId: user.id };

  const [newLeads, hotLeads, dueToday, overdue, visits, tasks, negotiations] = await Promise.all([
    db.lead.findMany({
      where: { ...mine, status: { in: ["New", "Contacted"] }, createdAt: { gte: new Date(now.getTime() - 3 * 86400000) } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.lead.findMany({
      where: { ...mine, temperature: "Hot", status: { notIn: ["Converted", "Lost", "Not Interested"] } },
      orderBy: { lastActivityAt: "asc" },
      take: 8,
    }),
    db.followUp.findMany({
      where: { assignedToId: user.id, status: "Pending", dueAt: { gte: tStart, lte: tEnd } },
      orderBy: { dueAt: "asc" },
      include: { lead: { select: { id: true, fullName: true, temperature: true } } },
    }),
    db.followUp.findMany({
      where: { assignedToId: user.id, status: "Pending", dueAt: { lt: tStart } },
      orderBy: { dueAt: "asc" },
      include: { lead: { select: { id: true, fullName: true, temperature: true } } },
    }),
    db.siteVisit.findMany({
      where: { assignedToId: user.id, status: { in: ["Scheduled", "Confirmed"] }, scheduledAt: { gte: tStart } },
      orderBy: { scheduledAt: "asc" },
      take: 8,
      include: { lead: { select: { id: true, fullName: true } }, property: { select: { title: true, location: true } } },
    }),
    db.task.findMany({
      where: { assignedToId: user.id, status: { in: ["Pending", "InProgress"] } },
      orderBy: { dueAt: "asc" },
      take: 10,
      include: { lead: { select: { id: true, fullName: true } } },
    }),
    db.deal.findMany({
      where: { assignedToId: user.id, stage: { in: ["Negotiation", "Token", "Booked"] } },
      orderBy: { updatedAt: "desc" },
      include: { lead: { select: { fullName: true } } },
    }),
  ]);

  const empty = !newLeads.length && !hotLeads.length && !dueToday.length && !overdue.length && !visits.length && !tasks.length && !negotiations.length;

  return (
    <>
      <PageHeader
        title="My Day"
        subtitle={now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
      />

      {empty ? (
        <EmptyState icon={Sparkles} title="Nothing pressing right now" description="No overdue follow-ups, visits or hot leads waiting. Good time to prospect." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {overdue.length > 0 && (
            <Section title="Overdue follow-ups" icon={AlertTriangle} tone="danger" count={overdue.length}>
              {overdue.map((f) => (
                <Line
                  key={f.id}
                  href={`/leads/${f.lead.id}`}
                  title={f.lead.fullName}
                  sub={`${f.type} · was due ${relativeTime(f.dueAt)}`}
                  badge={<Badge tone={temperatureTone(f.lead.temperature)} dot>{f.lead.temperature}</Badge>}
                  action={<CompleteFollowUpButton followUpId={f.id} />}
                />
              ))}
            </Section>
          )}

          <Section title="Follow-ups due today" icon={PhoneCall} count={dueToday.length}>
            {dueToday.length === 0 ? <Muted>Nothing due today.</Muted> : dueToday.map((f) => (
              <Line
                key={f.id}
                href={`/leads/${f.lead.id}`}
                title={f.lead.fullName}
                sub={`${f.type} · ${formatTime(f.dueAt)}${f.purpose ? ` · ${f.purpose}` : ""}`}
                action={<CompleteFollowUpButton followUpId={f.id} />}
              />
            ))}
          </Section>

          <Section title="Site visits" icon={MapPin} count={visits.length}>
            {visits.length === 0 ? <Muted>No upcoming visits.</Muted> : visits.map((v) => (
              <Line
                key={v.id}
                href={`/leads/${v.lead.id}`}
                title={v.lead.fullName}
                sub={`${v.property?.title ?? "Property TBD"} · ${formatDateTime(v.scheduledAt)}`}
                action={<SiteVisitFeedbackButton visitId={v.id} />}
              />
            ))}
          </Section>

          <Section title="Hot leads" icon={Flame} tone="danger" count={hotLeads.length}>
            {hotLeads.length === 0 ? <Muted>No hot leads.</Muted> : hotLeads.map((l) => (
              <Line
                key={l.id}
                href={`/leads/${l.id}`}
                title={l.fullName}
                sub={`${l.status} · last touch ${relativeTime(l.lastActivityAt)}`}
                badge={<Badge tone={statusTone(l.status)}>{l.status}</Badge>}
              />
            ))}
          </Section>

          <Section title="New leads" icon={Sparkles} count={newLeads.length}>
            {newLeads.length === 0 ? <Muted>No new leads in the last 3 days.</Muted> : newLeads.map((l) => (
              <Line key={l.id} href={`/leads/${l.id}`} title={l.fullName} sub={`${l.phone} · added ${relativeTime(l.createdAt)}`} />
            ))}
          </Section>

          {negotiations.length > 0 && (
            <Section title="Deals in negotiation" icon={Handshake} tone="gold" count={negotiations.length}>
              {negotiations.map((d) => (
                <Line
                  key={d.id}
                  href={`/deals/${d.id}`}
                  title={d.title}
                  sub={`${d.lead?.fullName ?? ""} · ${inr(d.value)}`}
                  badge={<Badge tone={dealStageTone(d.stage)}>{d.stage}</Badge>}
                />
              ))}
            </Section>
          )}

          <Section title="My tasks" icon={CheckSquare} count={tasks.length}>
            {tasks.length === 0 ? <Muted>No open tasks.</Muted> : tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2">
                <TaskCheckbox taskId={t.id} status={t.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-800">{t.title}</p>
                  <p className="text-xs text-ink-400">
                    {t.dueAt ? relativeTime(t.dueAt) : "No due date"}
                    {t.lead && ` · ${t.lead.fullName}`}
                  </p>
                </div>
              </div>
            ))}
          </Section>
        </div>
      )}
    </>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  tone,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  tone?: "danger" | "gold";
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Icon className={tone === "danger" ? "h-4 w-4 text-red-500" : tone === "gold" ? "h-4 w-4 text-gold-500" : "h-4 w-4 text-ink-400"} />
            {title}
            {count != null && <span className="rounded-full bg-ink-100 px-1.5 text-xs text-ink-500">{count}</span>}
          </span>
        }
      />
      <CardBody className="divide-y divide-ink-100 py-1">{children}</CardBody>
    </Card>
  );
}

function Line({
  href,
  title,
  sub,
  badge,
  action,
}: {
  href: string;
  title: string;
  sub: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Link href={href} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900 hover:text-brand-700">{title}</p>
        <p className="truncate text-xs text-ink-400">{sub}</p>
      </Link>
      {badge}
      {action}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-sm text-ink-400">{children}</p>;
}
