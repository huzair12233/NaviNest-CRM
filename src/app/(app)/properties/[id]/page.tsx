import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { matchLeads, matchBadge } from "@/lib/matching";
import { OPEN_LEAD_STATUSES } from "@/lib/constants";
import { PageHeader, StatRow, Divider, Avatar, EmptyState } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, propertyStatusTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PropertyStatusMenu } from "@/features/properties/status-menu";
import { Timeline } from "@/features/activity/timeline";
import { inr, toArray, formatDate } from "@/lib/utils";
import { Building, Pencil, MapPin, Home } from "lucide-react";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();

  const property = await db.property.findUnique({
    where: { id },
    include: {
      owner: true,
      project: true,
      addedBy: { select: { name: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, avatarColor: true } } } },
      interests: {
        orderBy: { sharedAt: "desc" },
        include: { lead: { select: { id: true, code: true, fullName: true, temperature: true, status: true } } },
      },
      siteVisits: {
        orderBy: { scheduledAt: "desc" },
        include: { lead: { select: { id: true, fullName: true } }, assignedTo: { select: { name: true } } },
      },
      deals: { select: { id: true, code: true, stage: true, value: true, type: true } },
    },
  });
  if (!property) notFound();

  const openLeads = await db.lead.findMany({
    where: {
      status: { in: [...OPEN_LEAD_STATUSES] },
      interest: property.listingType === "RENT" ? { in: ["RENT", "BOTH"] } : { in: ["SALE", "BOTH"] },
    },
    take: 150,
  });
  const leadMatches = matchLeads(property, openLeads, 8);
  const sharedLeadIds = new Set(property.interests.map((i) => i.lead.id));
  const amenities = toArray(property.amenities);
  const isRent = property.listingType === "RENT";

  return (
    <>
      <PageHeader
        title={property.title}
        breadcrumb={[{ label: "Properties", href: "/properties" }, { label: property.code }]}
        subtitle={
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {property.address ?? property.location}, {property.city}
          </span>
        }
        actions={
          <>
            <PropertyStatusMenu id={property.id} current={property.status} />
            <ButtonLink href={`/properties/${id}/edit`} size="sm" variant="outline">
              <Pencil className="h-4 w-4" /> Edit
            </ButtonLink>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={propertyStatusTone(property.status)}>{property.status}</Badge>
        <Badge tone="slate">{isRent ? "For Rent" : "For Sale"}</Badge>
        <Badge tone="slate">{property.segment}</Badge>
        <span className="text-lg font-semibold text-ink-900">
          {isRent ? `${inr(property.rent)}/mo` : inr(property.salePrice)}
        </span>
        {isRent && property.deposit ? <span className="text-sm text-ink-500">Deposit {inr(property.deposit)}</span> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="grid h-44 place-items-center rounded-t-xl bg-gradient-to-br from-brand-50 to-ink-100 text-ink-300">
              <Home className="h-10 w-10" />
            </div>
            <CardBody>
              <StatRow
                items={[
                  { label: "Configuration", value: `${property.bhk ? property.bhk + " BHK · " : ""}${property.propertyType}` },
                  { label: "Carpet area", value: property.carpetArea ? `${property.carpetArea} sqft` : "—" },
                  { label: "Built-up area", value: property.builtupArea ? `${property.builtupArea} sqft` : "—" },
                  { label: "Floor", value: property.floor ? `${property.floor} / ${property.totalFloors ?? "?"}` : "—" },
                  { label: "Furnishing", value: property.furnishing },
                  { label: "Parking", value: property.parking ? `${property.parking} spot(s)` : "None" },
                  { label: "Bathrooms", value: property.bathrooms ?? "—" },
                  { label: "Age", value: property.ageYears != null ? `${property.ageYears} yr` : "—" },
                  { label: "Possession", value: property.possession },
                  { label: "Maintenance", value: property.maintenance ? `${inr(property.maintenance)}/mo` : "—" },
                  { label: "Project", value: property.project?.name ?? "—" },
                  { label: "Listing source", value: property.listingSource },
                ]}
              />
              {amenities.length > 0 && (
                <>
                  <Divider label="Amenities" />
                  <div className="flex flex-wrap gap-1.5">
                    {amenities.map((a) => (
                      <Badge key={a} tone="slate">{a}</Badge>
                    ))}
                  </div>
                </>
              )}
              {property.description && (
                <>
                  <Divider />
                  <p className="text-sm text-ink-600">{property.description}</p>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Matched leads" subtitle="Open leads whose requirement fits this property" />
            <CardBody className="p-0">
              {leadMatches.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-ink-400">No matching open leads right now.</p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {leadMatches.map(({ lead, score, reasons }) => {
                    const badge = matchBadge(score);
                    return (
                      <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                          {score}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">
                            {lead.fullName}
                          </Link>
                          <p className="truncate text-xs text-ink-400">
                            {lead.code} · {lead.status} · {reasons.slice(0, 2).join(", ")}
                          </p>
                        </div>
                        {sharedLeadIds.has(lead.id) && <Badge tone="emerald">Shared</Badge>}
                        <Badge tone={badge.tone as "emerald"}>{badge.label}</Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {property.siteVisits.length > 0 && (
            <Card>
              <CardHeader title={`Site visits (${property.siteVisits.length})`} />
              <CardBody className="p-0">
                <ul className="divide-y divide-ink-100">
                  {property.siteVisits.map((v) => (
                    <li key={v.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <Link href={`/leads/${v.lead.id}`} className="font-medium text-ink-800 hover:text-brand-700">
                        {v.lead.fullName}
                      </Link>
                      <span className="text-ink-400">
                        {formatDate(v.scheduledAt)} · {v.status}
                        {v.interested ? ` · Interested: ${v.interested}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Owner" />
            <CardBody>
              {property.owner ? (
                <>
                  <Link href={`/owners/${property.owner.id}`} className="font-medium text-ink-900 hover:text-brand-700">
                    {property.owner.name}
                  </Link>
                  <StatRow
                    items={[
                      { label: "Phone", value: property.owner.phone },
                      { label: "WhatsApp", value: property.owner.whatsapp ?? "—" },
                      { label: "Preferred", value: property.owner.preferredContact },
                      { label: "Relationship", value: property.owner.relationshipStatus },
                    ]}
                  />
                </>
              ) : (
                <p className="text-sm text-ink-400">No owner linked.</p>
              )}
              <Divider />
              <StatRow
                items={[
                  { label: "Added by", value: property.addedBy?.name ?? "—" },
                  { label: "Listed on", value: formatDate(property.createdAt) },
                  { label: "Leads shared", value: property.interests.length },
                ]}
              />
              {property.deals.length > 0 && (
                <>
                  <Divider label="Transactions" />
                  {property.deals.map((d) => (
                    <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm hover:bg-ink-100">
                      <span className="font-medium">{d.code}</span>
                      <span className="text-ink-500">{d.stage} · {inr(d.value)}</span>
                    </Link>
                  ))}
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <CardBody className="max-h-[420px] overflow-y-auto scroll-thin">
              {property.activities.length ? (
                <Timeline items={property.activities} />
              ) : (
                <EmptyState icon={Building} title="No activity yet" />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
