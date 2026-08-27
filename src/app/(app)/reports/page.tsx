import { requireUser } from "@/lib/auth";
import { isManager } from "@/lib/rbac";
import { PageHeader, Avatar } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { KpiCard } from "@/features/dashboard/kpi-card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MiniBar } from "@/features/dashboard/charts";
import {
  sourceAttribution,
  teamPerformance,
  leadAgeing,
  visitConversion,
  funnelCounts,
} from "@/features/reports/queries";
import { inr, pct } from "@/lib/utils";

export default async function ReportsPage() {
  const user = await requireUser();
  const [sources, team, ageing, visits, funnel] = await Promise.all([
    sourceAttribution(),
    teamPerformance(),
    leadAgeing(),
    visitConversion(),
    funnelCounts(),
  ]);
  const showTeam = isManager(user);

  return (
    <>
      <PageHeader title="Reports" subtitle="How NaviNest is performing — sources, funnel, visits and team." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total leads" value={funnel.total} />
        <KpiCard label="Lead → deal conversion" value={`${funnel.conversion}%`} tone="success" />
        <KpiCard label="Visit → interest rate" value={`${visits.rate}%`} />
        <KpiCard label="Visits cancelled / no-show" value={visits.cancelled} tone={visits.cancelled ? "warning" : "default"} />
      </div>

      <Card className="mb-6">
        <CardHeader title="Lead source attribution" subtitle="Which sources actually generate business" />
        <CardBody className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Source</TH>
                <TH align="right">Leads</TH>
                <TH align="right">Qualified</TH>
                <TH align="right">Visits</TH>
                <TH align="right">Deals</TH>
                <TH align="right">Deal value</TH>
                <TH align="right">Conversion</TH>
              </tr>
            </THead>
            <TBody>
              {sources.map((s) => (
                <TR key={s.source}>
                  <TD>
                    <span className="font-medium text-ink-900">{s.source}</span>
                    <Badge tone="slate" className="ml-2">{s.category}</Badge>
                  </TD>
                  <TD align="right">{s.leads}</TD>
                  <TD align="right">{s.qualified} <span className="text-xs text-ink-400">({pct(s.qualified, s.leads)}%)</span></TD>
                  <TD align="right">{s.visits}</TD>
                  <TD align="right" className="font-medium">{s.deals}</TD>
                  <TD align="right">{s.value ? inr(s.value) : "—"}</TD>
                  <TD align="right">
                    <Badge tone={s.conversion >= 4 ? "emerald" : s.conversion >= 2 ? "amber" : "slate"}>
                      {s.conversion}%
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lead ageing" subtitle="Open leads by time since last activity" />
          <CardBody>
            <MiniBar data={ageing} color="#c8912a" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Site visit outcomes" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Stat label="Total scheduled" value={visits.total} />
              <Stat label="Completed" value={visits.completed} />
              <Stat label="Client interested" value={visits.interested} />
              <Stat label="Cancelled / no-show" value={visits.cancelled} />
            </div>
          </CardBody>
        </Card>
      </div>

      {showTeam && (
        <Card>
          <CardHeader title="Team performance" subtitle="Leads, visits, deals and commission per member" />
          <CardBody className="p-0">
            <Table>
              <THead>
                <tr>
                  <TH>Member</TH>
                  <TH align="right">Leads</TH>
                  <TH align="right">Visits</TH>
                  <TH align="right">Open deals</TH>
                  <TH align="right">Won</TH>
                  <TH align="right">Won value</TH>
                  <TH align="right">Commission (exp / recd)</TH>
                </tr>
              </THead>
              <TBody>
                {team.map((m) => (
                  <TR key={m.id}>
                    <TD>
                      <span className="flex items-center gap-2">
                        <Avatar name={m.name} color={m.color} size={22} />
                        <span className="font-medium text-ink-900">{m.name}</span>
                        <Badge tone="slate">{m.role}</Badge>
                      </span>
                    </TD>
                    <TD align="right">{m.leads}</TD>
                    <TD align="right">{m.visits}</TD>
                    <TD align="right">{m.openDeals}</TD>
                    <TD align="right" className="font-medium text-emerald-700">{m.wonDeals}</TD>
                    <TD align="right">{inr(m.wonValue)}</TD>
                    <TD align="right">
                      {inr(m.commissionExpected)} <span className="text-ink-400">/</span>{" "}
                      <span className="text-emerald-700">{inr(m.commissionReceived)}</span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-ink-50 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}
