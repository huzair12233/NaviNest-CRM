import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isManager } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { KpiCard } from "@/features/dashboard/kpi-card";
import {
  getDashboardData,
  getLeadTrend,
  getLeadBySource,
  getLeadByStatus,
  getPipelineFunnel,
} from "@/features/dashboard/kpis";
import {
  LeadTrendChart,
  CategoryBarChart,
  DonutChart,
  PipelineFunnel,
} from "@/features/dashboard/charts";
import { inr, relativeTime } from "@/lib/utils";
import { PIPELINE_STAGES } from "@/lib/constants";
import { ACTIVITY_META } from "@/features/activity/meta";
import { Flame, Users, PhoneCall, MapPin, Handshake, Coins } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const manager = isManager(user);

  const [{ kpis }, trend, bySource, byStatus, funnelRows, recent] = await Promise.all([
    getDashboardData(user),
    getLeadTrend(user),
    getLeadBySource(user),
    getLeadByStatus(user),
    getPipelineFunnel(user),
    db.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: true, lead: { select: { code: true, fullName: true } } },
    }),
  ]);

  const funnel = PIPELINE_STAGES.filter((s) => !s.key.startsWith("Closed")).map((s) => {
    const row = funnelRows.find((r) => r.stage === s.key);
    return { name: s.label, value: row?._count._all ?? 0, amount: row?._sum.value ?? 0 };
  });

  return (
    <>
      <PageHeader
        title={`Good ${greeting()}, ${user.name.split(" ")[0]}`}
        subtitle={manager ? "Team-wide view across NaviNest." : "Your leads, follow-ups and deals."}
        actions={
          <Link href="/my-day" className="text-sm font-medium text-brand-700 hover:underline">
            Open My Day →
          </Link>
        }
      />

      {/* Row 1 — pipeline health */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total Leads" value={kpis.totalLeads} href="/leads" icon={Users} />
        <KpiCard label="New Today" value={kpis.newToday} hint={`${kpis.newWeek} this week`} href="/leads?age=today" />
        <KpiCard label="Active Leads" value={kpis.activeLeads} href="/leads?bucket=open" />
        <KpiCard label="Hot Leads" value={kpis.hotLeads} tone="danger" href="/leads?temperature=Hot" icon={Flame} />
        <KpiCard label="Follow-ups Today" value={kpis.followupsToday} href="/follow-ups?tab=today" icon={PhoneCall} />
        <KpiCard
          label="Overdue Follow-ups"
          value={kpis.overdueFollowups}
          tone={kpis.overdueFollowups > 0 ? "danger" : "success"}
          href="/follow-ups?tab=overdue"
        />
      </section>

      {/* Row 2 — operations & money */}
      <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Site Visits Today" value={kpis.visitsToday} href="/site-visits?tab=today" icon={MapPin} />
        <KpiCard label="Upcoming Visits" value={kpis.upcomingVisits} href="/site-visits?tab=upcoming" />
        <KpiCard label="Open Deals" value={kpis.openDeals} hint={inr(kpis.pipelineValue) + " in pipeline"} href="/pipeline" icon={Handshake} />
        <KpiCard label="Closed This Month" value={kpis.closedThisMonth} tone="success" href="/deals?stage=Closed%20Won" />
        <KpiCard label="Pending Commission" value={inr(kpis.pendingComm)} tone="gold" href="/commissions?status=Pending" icon={Coins} />
        <KpiCard label="Received (Month)" value={inr(kpis.monthComm)} tone="success" href="/commissions" />
      </section>

      {/* Charts */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Lead flow" subtitle="New leads vs conversions, last 10 weeks" />
          <CardBody>
            <LeadTrendChart data={trend} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Lead status mix" />
          <CardBody>
            <DonutChart data={byStatus} />
          </CardBody>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Leads by source" subtitle="Where enquiries come from" action={<Link href="/reports" className="text-xs font-medium text-brand-700 hover:underline">Source report →</Link>} />
          <CardBody>
            {bySource.length ? <CategoryBarChart data={bySource} /> : <Empty />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Sales pipeline" subtitle="Open deals by stage" action={<Link href="/pipeline" className="text-xs font-medium text-brand-700 hover:underline">Open pipeline →</Link>} />
          <CardBody>
            {funnel.some((f) => f.value) ? <PipelineFunnel data={funnel} /> : <Empty />}
          </CardBody>
        </Card>
      </section>

      {/* Activity */}
      <section className="mt-4">
        <Card>
          <CardHeader title="What's happening" subtitle="Latest activity across NaviNest" />
          <CardBody className="p-0">
            <ul className="divide-y divide-ink-100">
              {recent.map((a) => {
                const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.NOTE;
                return (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${meta.bg}`}>
                      <meta.icon className={`h-3.5 w-3.5 ${meta.fg}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-800">
                        {a.summary}
                        {a.lead && (
                          <Link href={`/leads/${a.leadId}`} className="ml-1 font-medium text-brand-700 hover:underline">
                            {a.lead.fullName}
                          </Link>
                        )}
                      </p>
                      <p className="text-xs text-ink-400">
                        {a.user?.name ?? "System"} · {relativeTime(a.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </section>
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

function Empty() {
  return <p className="py-10 text-center text-sm text-ink-400">Not enough data yet.</p>;
}
