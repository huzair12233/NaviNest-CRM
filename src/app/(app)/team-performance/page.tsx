import { requireRole } from "@/lib/auth";
import { PageHeader, Avatar } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { MiniBar } from "@/features/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { teamPerformance } from "@/features/reports/queries";
import { inr } from "@/lib/utils";

export default async function TeamPerformancePage() {
  await requireRole("ADMIN", "MANAGER");
  const team = await teamPerformance();

  return (
    <>
      <PageHeader title="Team Performance" subtitle="Where every member stands this cycle." />

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Leads owned" />
          <CardBody><MiniBar data={team.map((m) => ({ name: m.name.split(" ")[0], value: m.leads }))} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Deals won" />
          <CardBody><MiniBar data={team.map((m) => ({ name: m.name.split(" ")[0], value: m.wonDeals }))} color="#0f766e" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Commission received" />
          <CardBody><MiniBar data={team.map((m) => ({ name: m.name.split(" ")[0], value: Math.round(m.commissionReceived / 1000) }))} color="#c8912a" /></CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {team.map((m) => (
          <Card key={m.id}>
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={m.name} color={m.color} size={40} />
                <div>
                  <p className="font-semibold text-ink-900">{m.name}</p>
                  <Badge tone="slate">{m.role}</Badge>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Row label="Leads" value={m.leads} />
                <Row label="Site visits" value={m.visits} />
                <Row label="Open deals" value={m.openDeals} />
                <Row label="Won deals" value={m.wonDeals} />
                <Row label="Won value" value={inr(m.wonValue)} />
                <Row label="Comm. received" value={inr(m.commissionReceived)} />
              </dl>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}
