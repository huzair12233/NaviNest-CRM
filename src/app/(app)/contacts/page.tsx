import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getParam, paginate, type SearchParams } from "@/lib/pagination";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { SearchBox, FilterSelect, Pagination } from "@/components/ui/query-controls";
import { CONTACT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { UserSquare2, Plus } from "lucide-react";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  await requireUser();
  const { skip, take, page, pageSize } = paginate(sp);
  const q = getParam(sp, "q")?.trim();
  const type = getParam(sp, "type");
  const where = {
    AND: [
      q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] } : {},
      type ? { type } : {},
    ],
  };
  const [rows, total] = await Promise.all([
    db.contact.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.contact.count({ where }),
  ]);

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="One record per person. Duplicate phone numbers are blocked on entry."
        actions={<ButtonLink href="/contacts/new" size="sm"><Plus className="h-4 w-4" /> Add Contact</ButtonLink>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBox placeholder="Name, phone or email…" />
        <FilterSelect name="type" label="Type" options={CONTACT_TYPES} />
        <span className="ml-auto text-sm text-ink-400">{total} contacts</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={UserSquare2} title="No contacts found" action={<ButtonLink href="/contacts/new" size="sm"><Plus className="h-4 w-4" /> Add Contact</ButtonLink>} />
      ) : (
        <>
          <Table>
            <THead><tr><TH>Name</TH><TH>Phone</TH><TH>Email</TH><TH>Type</TH><TH>Added</TH></tr></THead>
            <TBody>
              {rows.map((c) => (
                <TR key={c.id}>
                  <TD><Link href={`/contacts/${c.id}`} className="font-medium text-ink-900 hover:text-brand-700">{c.name}</Link></TD>
                  <TD className="text-sm">{c.phone}</TD>
                  <TD className="text-sm text-ink-500">{c.email ?? "—"}</TD>
                  <TD><Badge tone="slate">{c.type}</Badge></TD>
                  <TD className="text-xs text-ink-500">{formatDate(c.createdAt)}</TD>
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
