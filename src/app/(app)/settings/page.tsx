import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateDrawer } from "@/components/form/create-drawer";
import { TextField, SelectField } from "@/components/form/fields";
import { ToggleSourceButton } from "@/features/ops/toggle-source-button";
import { addLeadSource } from "@/features/ops/actions";

export default async function SettingsPage() {
  await requireRole("ADMIN");
  const sources = await db.leadSource.findMany({
    orderBy: { sortkey: "asc" },
    include: { _count: { select: { leads: true } } },
  });

  return (
    <>
      <PageHeader title="Settings" subtitle="Configuration for NaviNest CRM." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Lead sources"
            subtitle="Channels enquiries can come from"
            action={
              <CreateDrawer label="Add source" title="Add lead source" action={addLeadSource} successToast="Source added">
                <TextField name="name" label="Source name" required />
                <SelectField
                  name="category"
                  label="Category"
                  options={["Portal", "Social", "Referral", "Direct", "Partner", "Other"]}
                  defaultValue="Other"
                />
              </CreateDrawer>
            }
          />
          <CardBody className="p-0">
            <ul className="divide-y divide-ink-100">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className={s.active ? "font-medium text-ink-900" : "font-medium text-ink-400 line-through"}>
                      {s.name}
                    </span>
                    <Badge tone="slate" className="ml-2">{s.category}</Badge>
                    <span className="ml-2 text-xs text-ink-400">{s._count.leads} leads</span>
                  </div>
                  <ToggleSourceButton id={s.id} active={s.active} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Defaults & environment" />
          <CardBody className="space-y-3 text-sm text-ink-600">
            <Row label="Base city" value="Navi Mumbai" />
            <Row label="Currency" value="₹ INR (lakh / crore formatting)" />
            <Row label="Default commission — sale" value="1.5% of deal value" />
            <Row label="Default commission — rental" value="1 month rent (~8.3%)" />
            <Row label="Employee / company split" value="30% / 70%" />
            <Row label="Lead visibility" value="Admin & Manager: all · Sales: assigned only" />
            <Row label="Database" value="SQLite (dev) · PostgreSQL (production)" />
            <p className="pt-2 text-xs text-ink-400">
              Commission defaults are applied when a deal is won; managers can override per deal.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-2">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800">{value}</span>
    </div>
  );
}
