import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/utils";
import { PageHeader, StatRow } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Pencil, Phone, MessageCircle } from "lucide-react";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const contact = await db.contact.findUnique({ where: { id }, include: { leads: true } });
  if (!contact) notFound();

  const tail = normalizePhone(contact.phone);
  const relatedLeads = await db.lead.findMany({
    where: { phone: { endsWith: tail } },
    select: { id: true, code: true, fullName: true, status: true, interest: true },
  });

  return (
    <>
      <PageHeader
        title={contact.name}
        breadcrumb={[{ label: "Contacts", href: "/contacts" }, { label: contact.name }]}
        subtitle={
          <span className="flex gap-3">
            <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 hover:text-brand-700"><Phone className="h-3.5 w-3.5" /> {contact.phone}</a>
            {contact.whatsapp && <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {contact.whatsapp}</span>}
          </span>
        }
        actions={<ButtonLink href={`/contacts/${id}/edit`} size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</ButtonLink>}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardBody>
            <StatRow
              items={[
                { label: "Type", value: <Badge tone="slate">{contact.type}</Badge> },
                { label: "Email", value: contact.email ?? "—" },
                { label: "Alt phone", value: contact.altPhone ?? "—" },
                { label: "Added", value: formatDate(contact.createdAt) },
              ]}
            />
            {contact.notes && <p className="mt-4 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">{contact.notes}</p>}
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={`Linked leads (${relatedLeads.length})`} />
          <CardBody className="p-0">
            {relatedLeads.length === 0 ? (
              <p className="p-5 text-sm text-ink-400">No leads for this phone number yet. <Link href="/leads/new" className="text-brand-700 hover:underline">Create one</Link>.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {relatedLeads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between px-5 py-3">
                    <Link href={`/leads/${l.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">{l.fullName} <span className="text-xs text-ink-400">{l.code}</span></Link>
                    <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
