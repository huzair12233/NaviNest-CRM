import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isManager } from "@/lib/rbac";
import { PageHeader, StatRow, Divider } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, dealStageTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Timeline } from "@/features/activity/timeline";
import { DealMoveControls } from "@/features/deals/move-controls";
import { DealStageChanger } from "@/features/deals/stage-changer";
import { CommissionForm } from "@/features/deals/commission-form";
import { inr, formatDate } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const manager = isManager(user);

  const deal = await db.deal.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, code: true, fullName: true, phone: true } },
      property: { select: { id: true, code: true, title: true, location: true } },
      owner: { select: { id: true, name: true, phone: true } },
      contact: { select: { id: true, name: true } },
      channelPartner: { select: { name: true } },
      assignedTo: { select: { name: true } },
      commission: true,
      activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, avatarColor: true } } } },
    },
  });
  if (!deal) notFound();

  const c = deal.commission;
  const empShare = c ? Math.round((c.expectedAmount * c.employeeSharePct) / 100) : 0;

  return (
    <>
      <PageHeader
        title={deal.title}
        breadcrumb={[{ label: "Deals", href: "/deals" }, { label: deal.code }]}
        actions={
          <>
            <DealMoveControls dealId={deal.id} stage={deal.stage} />
            <DealStageChanger dealId={deal.id} stage={deal.stage} />
            <ButtonLink href={`/deals/${id}/edit`} size="sm" variant="ghost"><Pencil className="h-4 w-4" /> Edit</ButtonLink>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={dealStageTone(deal.stage)}>{deal.stage}</Badge>
        <Badge tone="slate">{deal.type === "RENT" ? "Rental" : "Sale"}</Badge>
        <span className="text-lg font-semibold text-ink-900">{inr(deal.value)}</span>
        <span className="text-sm text-ink-400">{deal.probability}% probability</span>
        {deal.closedAt && <span className="text-sm text-ink-400">Closed {formatDate(deal.closedAt)}</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Deal" />
            <CardBody>
              <StatRow
                items={[
                  { label: "Lead", value: deal.lead ? <Link href={`/leads/${deal.lead.id}`} className="text-brand-700 hover:underline">{deal.lead.fullName}</Link> : "—" },
                  { label: "Property", value: deal.property ? <Link href={`/properties/${deal.property.id}`} className="text-brand-700 hover:underline">{deal.property.title}</Link> : "—" },
                  { label: "Owner", value: deal.owner ? <Link href={`/owners/${deal.owner.id}`} className="text-brand-700 hover:underline">{deal.owner.name}</Link> : "—" },
                  { label: "Channel partner", value: deal.channelPartner?.name ?? "—" },
                  { label: "Assigned to", value: deal.assignedTo?.name ?? "—" },
                  { label: "Expected close", value: deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "—" },
                ]}
              />
              {deal.lostReason && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Lost: {deal.lostReason}</p>}
              {deal.notes && <><Divider /><p className="text-sm text-ink-600">{deal.notes}</p></>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <CardBody className="max-h-[420px] overflow-y-auto scroll-thin">
              <Timeline items={deal.activities} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Commission"
              action={
                manager ? (
                  <CommissionForm dealId={deal.id} dealValue={deal.value} commission={c} label={c ? "Edit" : "Set up"} />
                ) : null
              }
            />
            <CardBody>
              {c ? (
                <StatRow
                  items={[
                    { label: "Rate", value: `${c.percentage}%` },
                    { label: "Status", value: <Badge tone={c.status === "Received" ? "emerald" : c.status === "Partial" ? "amber" : "slate"}>{c.status}</Badge> },
                    { label: "Expected", value: inr(c.expectedAmount) },
                    { label: "Received", value: inr(c.receivedAmount) },
                    { label: "Pending", value: inr(Math.max(0, c.expectedAmount - c.receivedAmount)) },
                    { label: "Employee share", value: `${inr(empShare)} (${c.employeeSharePct}%)` },
                    { label: "Last payment", value: c.paymentDate ? formatDate(c.paymentDate) : "—" },
                  ]}
                />
              ) : (
                <p className="text-sm text-ink-400">
                  No commission record yet. It opens automatically when the deal is marked <b>Closed Won</b>
                  {manager ? ", or set it up now." : "."}
                </p>
              )}
              {c?.notes && <p className="mt-3 rounded-lg bg-ink-50 p-3 text-xs text-ink-600">{c.notes}</p>}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
