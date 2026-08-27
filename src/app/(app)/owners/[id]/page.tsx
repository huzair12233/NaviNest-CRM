import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, StatRow, EmptyState } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, propertyStatusTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { LogContactButton } from "@/features/directory/log-contact-button";
import { inr, formatDate, relativeTime } from "@/lib/utils";
import { Pencil, Phone, MessageCircle, Mail, Building } from "lucide-react";

export default async function OwnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const owner = await db.owner.findUnique({
    where: { id },
    include: {
      properties: { orderBy: { createdAt: "desc" } },
      deals: { select: { id: true, code: true, stage: true, value: true } },
    },
  });
  if (!owner) notFound();

  return (
    <>
      <PageHeader
        title={owner.name}
        breadcrumb={[{ label: "Owners", href: "/owners" }, { label: owner.name }]}
        subtitle={
          <span className="flex flex-wrap gap-3">
            <a href={`tel:${owner.phone}`} className="inline-flex items-center gap-1 hover:text-brand-700"><Phone className="h-3.5 w-3.5" /> {owner.phone}</a>
            {owner.whatsapp && <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {owner.whatsapp}</span>}
            {owner.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {owner.email}</span>}
          </span>
        }
        actions={
          <>
            <LogContactButton ownerId={owner.id} />
            <ButtonLink href={`/owners/${id}/edit`} size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</ButtonLink>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody>
            <StatRow
              items={[
                { label: "Relationship", value: <Badge tone={owner.relationshipStatus === "VIP" ? "gold" : "emerald"}>{owner.relationshipStatus}</Badge> },
                { label: "Preferred contact", value: owner.preferredContact },
                { label: "Last contacted", value: owner.lastContactedAt ? relativeTime(owner.lastContactedAt) : "Never" },
                { label: "Added", value: formatDate(owner.createdAt) },
                { label: "Properties", value: owner.properties.length },
                { label: "Deals", value: owner.deals.length },
              ]}
            />
            {owner.notes && <p className="mt-4 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">{owner.notes}</p>}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`Properties (${owner.properties.length})`} action={<Link href="/properties/new" className="text-xs font-medium text-brand-700 hover:underline">Add property →</Link>} />
          <CardBody className="p-0">
            {owner.properties.length === 0 ? (
              <div className="p-5"><EmptyState icon={Building} title="No properties linked to this owner" /></div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {owner.properties.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <Link href={`/properties/${p.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">{p.title}</Link>
                      <p className="text-xs text-ink-400">{p.code} · {p.location} · {p.listingType === "RENT" ? `${inr(p.rent)}/mo` : inr(p.salePrice)}</p>
                    </div>
                    <Badge tone={propertyStatusTone(p.status)}>{p.status}</Badge>
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
