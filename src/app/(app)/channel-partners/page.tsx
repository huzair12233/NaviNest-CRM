import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateDrawer } from "@/components/form/create-drawer";
import { TextField, TextAreaField } from "@/components/form/fields";
import { createChannelPartner } from "@/features/ops/actions";
import { inr } from "@/lib/utils";
import { Network } from "lucide-react";

export default async function ChannelPartnersPage() {
  await requireUser();
  const partners = await db.channelPartner.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { leads: true } },
      deals: { select: { value: true, stage: true, commission: { select: { expectedAmount: true, receivedAmount: true } } } },
    },
  });

  return (
    <>
      <PageHeader
        title="Channel Partners"
        subtitle="Brokers and associates who bring leads or share inventory."
        actions={
          <CreateDrawer label="Add Partner" title="Add channel partner" action={createChannelPartner} successToast="Partner added">
            <TextField name="name" label="Contact name" required />
            <TextField name="company" label="Company" />
            <TextField name="phone" label="Phone" type="tel" required />
            <TextField name="email" label="Email" type="email" />
            <TextField name="reraId" label="RERA ID" />
            <TextAreaField name="notes" label="Notes" />
          </CreateDrawer>
        }
      />
      {partners.length === 0 ? (
        <EmptyState icon={Network} title="No channel partners yet" />
      ) : (
        <Table>
          <THead><tr><TH>Partner</TH><TH>Contact</TH><TH>RERA</TH><TH align="right">Leads</TH><TH align="right">Deals</TH><TH align="right">Commission pending</TH></tr></THead>
          <TBody>
            {partners.map((p) => {
              const closed = p.deals.filter((d) => d.stage === "Closed Won");
              const pending = p.deals.reduce((s, d) => s + Math.max(0, (d.commission?.expectedAmount ?? 0) - (d.commission?.receivedAmount ?? 0)), 0);
              return (
                <TR key={p.id}>
                  <TD>
                    <span className="font-medium text-ink-900">{p.name}</span>
                    {p.company && <span className="block text-xs text-ink-400">{p.company}</span>}
                  </TD>
                  <TD className="text-sm">{p.phone}{p.email && <span className="block text-xs text-ink-400">{p.email}</span>}</TD>
                  <TD className="text-xs text-ink-500">{p.reraId ?? "—"}</TD>
                  <TD align="right">{p._count.leads}</TD>
                  <TD align="right">{closed.length}<span className="text-xs text-ink-400"> / {p.deals.length}</span></TD>
                  <TD align="right">{pending > 0 ? <Badge tone="gold">{inr(pending)}</Badge> : <span className="text-xs text-ink-300">—</span>}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
