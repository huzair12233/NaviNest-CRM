import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dealScope } from "@/lib/rbac";
import { getParam, paginate, type SearchParams } from "@/lib/pagination";
import { PageHeader, EmptyState, Avatar } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Badge, dealStageTone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { SearchBox, FilterSelect, Pagination } from "@/components/ui/query-controls";
import { PIPELINE_STAGES } from "@/lib/constants";
import { inr, formatDate } from "@/lib/utils";
import { Handshake, Plus } from "lucide-react";

export default async function DealsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const { skip, take, page, pageSize } = paginate(sp);
  const q = getParam(sp, "q")?.trim();
  const stage = getParam(sp, "stage");
  const type = getParam(sp, "type");
  const where = {
    AND: [
      dealScope(user),
      q ? { OR: [{ title: { contains: q } }, { code: { contains: q } }] } : {},
      stage ? { stage } : {},
      type ? { type } : {},
    ],
  };
  const [rows, total, agg] = await Promise.all([
    db.deal.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      include: {
        lead: { select: { id: true, fullName: true } },
        property: { select: { location: true } },
        assignedTo: { select: { name: true, avatarColor: true } },
        commission: { select: { status: true, expectedAmount: true } },
      },
    }),
    db.deal.count({ where }),
    db.deal.aggregate({ where, _sum: { value: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Deals"
        subtitle={`${total} deals · ${inr(agg._sum.value ?? 0)} total value`}
        actions={<ButtonLink href="/deals/new" size="sm"><Plus className="h-4 w-4" /> New Deal</ButtonLink>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBox placeholder="Title or deal ID…" />
        <FilterSelect name="stage" options={PIPELINE_STAGES.map((s) => s.key)} />
        <FilterSelect name="type" options={[{ value: "SALE", label: "Sale" }, { value: "RENT", label: "Rental" }]} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Handshake} title="No deals yet" description="Deals are created from a lead in negotiation, or here directly." action={<ButtonLink href="/deals/new" size="sm"><Plus className="h-4 w-4" /> New Deal</ButtonLink>} />
      ) : (
        <>
          <Table>
            <THead><tr><TH>Deal</TH><TH>Lead</TH><TH>Stage</TH><TH align="right">Value</TH><TH align="right">Prob.</TH><TH>Owner</TH><TH>Commission</TH><TH>Close</TH></tr></THead>
            <TBody>
              {rows.map((d) => (
                <TR key={d.id}>
                  <TD><Link href={`/deals/${d.id}`} className="font-medium text-ink-900 hover:text-brand-700">{d.title}</Link><span className="block text-xs text-ink-400">{d.code}</span></TD>
                  <TD className="text-sm">{d.lead ? <Link href={`/leads/${d.lead.id}`} className="hover:text-brand-700">{d.lead.fullName}</Link> : "—"}</TD>
                  <TD><Badge tone={dealStageTone(d.stage)}>{d.stage}</Badge></TD>
                  <TD align="right" className="font-medium">{inr(d.value)}</TD>
                  <TD align="right" className="text-sm text-ink-500">{d.probability}%</TD>
                  <TD>{d.assignedTo && <span className="flex items-center gap-1.5 text-xs"><Avatar name={d.assignedTo.name} color={d.assignedTo.avatarColor} size={18} />{d.assignedTo.name.split(" ")[0]}</span>}</TD>
                  <TD>{d.commission ? <Badge tone={d.commission.status === "Received" ? "emerald" : d.commission.status === "Partial" ? "amber" : "slate"}>{d.commission.status}</Badge> : <span className="text-xs text-ink-300">—</span>}</TD>
                  <TD className="text-xs text-ink-500">{d.closedAt ? formatDate(d.closedAt) : d.expectedCloseDate ? formatDate(d.expectedCloseDate) : "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} pageSize={pageSize} total={total} />
        </>
      )}
    </>
  );
}
