import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getParam, paginate, type SearchParams } from "@/lib/pagination";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { SearchBox, Pagination } from "@/components/ui/query-controls";
import { formatDate, relativeTime } from "@/lib/utils";
import { Landmark, Plus } from "lucide-react";

export default async function OwnersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  await requireUser();
  const { skip, take, page, pageSize } = paginate(sp);
  const q = getParam(sp, "q")?.trim();
  const where = q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : {};
  const [rows, total] = await Promise.all([
    db.owner.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { _count: { select: { properties: true } } } }),
    db.owner.count({ where }),
  ]);

  return (
    <>
      <PageHeader
        title="Owners"
        subtitle="Landlords and sellers whose properties NaviNest represents."
        actions={<ButtonLink href="/owners/new" size="sm"><Plus className="h-4 w-4" /> Add Owner</ButtonLink>}
      />
      <div className="mb-4 flex items-center justify-between gap-2">
        <SearchBox placeholder="Name or phone…" />
        <span className="text-sm text-ink-400">{total} owners</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Landmark} title="No owners yet" action={<ButtonLink href="/owners/new" size="sm"><Plus className="h-4 w-4" /> Add Owner</ButtonLink>} />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Owner</TH>
                <TH>Phone</TH>
                <TH>Relationship</TH>
                <TH align="right">Properties</TH>
                <TH>Last contacted</TH>
                <TH>Added</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link href={`/owners/${o.id}`} className="font-medium text-ink-900 hover:text-brand-700">{o.name}</Link>
                  </TD>
                  <TD className="text-sm">{o.phone}</TD>
                  <TD><Badge tone={o.relationshipStatus === "VIP" ? "gold" : o.relationshipStatus === "Cold" ? "slate" : "emerald"}>{o.relationshipStatus}</Badge></TD>
                  <TD align="right">{o._count.properties}</TD>
                  <TD className="text-xs text-ink-500">{o.lastContactedAt ? relativeTime(o.lastContactedAt) : "Never"}</TD>
                  <TD className="text-xs text-ink-500">{formatDate(o.createdAt)}</TD>
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
