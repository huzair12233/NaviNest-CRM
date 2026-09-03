import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isManager } from "@/lib/rbac";
import { getParam, type SearchParams } from "@/lib/pagination";
import { startOfMonth } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { KpiCard } from "@/features/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { FilterSelect } from "@/components/ui/query-controls";
import { CommissionForm } from "@/features/deals/commission-form";
import { COMMISSION_STATUSES } from "@/lib/constants";
import { inr, formatDate } from "@/lib/utils";
import { Coins } from "lucide-react";

export default async function CommissionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const manager = isManager(user);
  const status = getParam(sp, "status");

  const where = status ? { status } : {};
  const [rows, agg, monthAgg] = await Promise.all([
    db.commission.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        deal: {
          select: {
            id: true, code: true, title: true, type: true,
            lead: { select: { fullName: true } },
            assignedTo: { select: { name: true } },
          },
        },
      },
    }),
    db.commission.aggregate({ _sum: { expectedAmount: true, receivedAmount: true } }),
    db.commission.aggregate({ _sum: { receivedAmount: true }, where: { paymentDate: { gte: startOfMonth() } } }),
  ]);

  const expected = agg._sum.expectedAmount ?? 0;
  const received = agg._sum.receivedAmount ?? 0;

  return (
    <>
      <PageHeader title="Commissions" subtitle="Brokerage earnings tied to closed deals." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Expected" value={inr(expected)} />
        <KpiCard label="Received" value={inr(received)} tone="success" />
        <KpiCard label="Pending" value={inr(Math.max(0, expected - received))} tone="gold" href="/commissions?status=Pending" />
        <KpiCard label="Received this month" value={inr(monthAgg._sum.receivedAmount ?? 0)} tone="success" />
      </div>

      <div className="mb-4">
        <FilterSelect name="status" label="Status" options={COMMISSION_STATUSES} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Coins} title="No commission records yet" description="They appear automatically when a deal is marked Closed Won." />
      ) : (
        <Table>
          <THead><tr><TH>Deal</TH><TH>Client</TH><TH>Agent</TH><TH align="right">Rate</TH><TH align="right">Expected</TH><TH align="right">Received</TH><TH align="right">Pending</TH><TH>Status</TH><TH>Paid</TH>{manager && <TH></TH>}</tr></THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD><Link href={`/deals/${c.deal.id}`} className="font-medium text-ink-900 hover:text-brand-700">{c.deal.code}</Link><span className="block max-w-[160px] truncate text-xs text-ink-400">{c.deal.title}</span></TD>
                <TD className="text-sm">{c.deal.lead?.fullName ?? "—"}</TD>
                <TD className="text-sm text-ink-500">{c.deal.assignedTo?.name ?? "—"}</TD>
                <TD align="right" className="text-sm">{c.percentage}%</TD>
                <TD align="right" className="font-medium">{inr(c.expectedAmount)}</TD>
                <TD align="right" className="text-emerald-700">{inr(c.receivedAmount)}</TD>
                <TD align="right" className="text-gold-600">{inr(Math.max(0, c.expectedAmount - c.receivedAmount))}</TD>
                <TD><Badge tone={c.status === "Received" ? "emerald" : c.status === "Partial" ? "amber" : "slate"}>{c.status}</Badge></TD>
                <TD className="text-xs text-ink-500">{c.paymentDate ? formatDate(c.paymentDate) : "—"}</TD>
                {manager && <TD><CommissionForm dealId={c.dealId} dealValue={c.dealValue} commission={c} label="Edit" /></TD>}
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
