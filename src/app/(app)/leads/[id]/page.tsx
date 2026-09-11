import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isManager } from "@/lib/rbac";
import { INTEREST_LABELS } from "@/lib/constants";
import { PageHeader, Avatar, StatRow, Divider } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import {
  Badge,
  statusTone,
  temperatureTone,
  priorityTone,
} from "@/components/ui/badge";
import { Timeline } from "@/features/activity/timeline";
import { MatchedProperties } from "@/features/leads/matched-properties";
import { LeadQuickActions } from "@/features/leads/quick-actions";
import { CompleteFollowUpButton } from "@/features/followups/complete-button";
import { SiteVisitFeedbackButton } from "@/features/sitevisits/feedback-button";
import {
  inr,
  inrRange,
  listingPrice,
  formatDate,
  formatDateTime,
  relativeTime,
  toArray,
  daysBetween,
  startOfDay,
} from "@/lib/utils";
import { Phone, Mail, MessageCircle, CalendarClock, MapPin, Link2 } from "lucide-react";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      createdBy: { select: { name: true } },
      source: true,
      channelPartner: true,
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, avatarColor: true } } },
      },
      followUps: {
        orderBy: { dueAt: "asc" },
        include: { assignedTo: { select: { name: true } } },
      },
      siteVisits: {
        orderBy: { scheduledAt: "desc" },
        include: { property: { select: { title: true, code: true } }, assignedTo: { select: { name: true } } },
      },
      interests: {
        orderBy: { sharedAt: "desc" },
        include: { property: { select: { id: true, code: true, title: true, location: true, salePrice: true, rent: true, deposit: true, listingType: true, status: true } } },
      },
      deals: { select: { id: true, code: true, stage: true, value: true } },
    },
  });
  if (!lead) notFound();

  const [team, propList] = await Promise.all([
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.property.findMany({
      where: {
        listingType:
          lead.interest === "RENT" ? "RENT" : lead.interest === "HEAVY_DEPOSIT" ? "HEAVY_DEPOSIT" : "SALE",
        status: { in: ["Available", "Hold"] },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, code: true, title: true },
    }),
  ]);

  const openFollowUps = lead.followUps.filter((f) => f.status === "Pending");
  const ageDays = daysBetween(startOfDay(), startOfDay(lead.lastActivityAt));
  const locs = toArray(lead.locations);
  const isRent = lead.interest === "RENT";
  const isHeavyDeposit = lead.interest === "HEAVY_DEPOSIT";

  return (
    <>
      <PageHeader
        title={lead.fullName}
        breadcrumb={[{ label: "Leads", href: "/leads" }, { label: lead.code }]}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 hover:text-brand-700">
              <Phone className="h-3.5 w-3.5" /> {lead.phone}
            </a>
            {lead.whatsapp && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" /> {lead.whatsapp}
              </span>
            )}
            {lead.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {lead.email}
              </span>
            )}
          </span>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
        <Badge tone={temperatureTone(lead.temperature)} dot>
          {lead.temperature}
        </Badge>
        <Badge tone={priorityTone(lead.priority)}>{lead.priority} priority</Badge>
        <Badge tone="slate">{INTEREST_LABELS[lead.interest] ?? lead.interest}</Badge>
        {lead.source && <Badge tone="brand">{lead.source.name}</Badge>}
        <span className="text-xs text-ink-400">
          Age {ageDays === 0 ? "today" : `${ageDays}d`} · created {formatDate(lead.createdAt)}
        </span>
      </div>

      <div className="mb-6">
        <LeadQuickActions
          lead={{
            id: lead.id,
            fullName: lead.fullName,
            phone: lead.phone,
            whatsapp: lead.whatsapp,
            status: lead.status,
            temperature: lead.temperature,
            assignedToId: lead.assignedToId,
          }}
          team={team}
          properties={propList.map((p) => ({ id: p.id, label: `${p.code} · ${p.title}` }))}
          canAssign={isManager(user)}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Requirement" action={<Link href={`/leads/${id}/edit`} className="text-xs font-medium text-brand-700 hover:underline">Edit</Link>} />
            <CardBody>
              <StatRow
                items={[
                  { label: "Looking for", value: `${lead.bhk ? lead.bhk + " BHK " : ""}${lead.propertyType ?? "Any"}` },
                  {
                    label: isRent ? "Rent" : isHeavyDeposit ? "Deposit budget" : "Budget",
                    value: isRent ? inrRange(lead.rentMin, lead.rentMax) : inrRange(lead.budgetMin, lead.budgetMax),
                  },
                  ...(isRent ? [{ label: "Max deposit", value: inr(lead.depositMax) }] : []),
                  { label: "Carpet area", value: lead.areaMin || lead.areaMax ? `${lead.areaMin ?? "?"}–${lead.areaMax ?? "?"} sqft` : "—" },
                  { label: "Furnishing", value: lead.furnishing ?? "Any" },
                  { label: "Possession", value: lead.possessionReq ?? "Any" },
                  { label: "Occupancy", value: lead.occupancy ?? "—" },
                  { label: "Parking", value: lead.parkingReq ? "Required" : "Not required" },
                  { label: "Home loan", value: lead.loanRequired ? "Required" : "No" },
                ]}
              />
              <Divider />
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-ink-500">Preferred locations: </span>
                  {locs.length ? locs.join(", ") : "Not specified"}
                </p>
                {lead.preferredProject && (
                  <p>
                    <span className="text-ink-500">Preferred project: </span>
                    {lead.preferredProject}
                  </p>
                )}
                {lead.requirementNotes && (
                  <p className="rounded-lg bg-ink-50 p-3 text-ink-600">{lead.requirementNotes}</p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Matched properties"
              subtitle="Rule-based fit on location, budget, BHK, area & amenities"
            />
            <CardBody className="py-0">
              <MatchedProperties lead={lead} />
            </CardBody>
          </Card>

          {lead.interests.length > 0 && (
            <Card>
              <CardHeader title={`Properties shared (${lead.interests.length})`} />
              <CardBody className="p-0">
                <ul className="divide-y divide-ink-100">
                  {lead.interests.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 px-5 py-3">
                      <Link2 className="h-4 w-4 text-ink-300" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/properties/${it.property.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">
                          {it.property.title}
                        </Link>
                        <p className="text-xs text-ink-400">
                          {it.property.code} · {it.property.location} · {listingPrice(it.property)}
                        </p>
                      </div>
                      {it.matchScore != null && <span className="text-xs font-semibold text-brand-700">{it.matchScore}%</span>}
                      <Badge tone={it.status === "INTERESTED" ? "emerald" : it.status === "REJECTED" ? "red" : "slate"}>
                        {it.status === "SHARED" ? "Shared" : it.status === "INTERESTED" ? "Interested" : "Rejected"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {(openFollowUps.length > 0 || lead.siteVisits.length > 0) && (
            <Card>
              <CardHeader title="Open follow-ups & visits" />
              <CardBody className="space-y-2">
                {openFollowUps.map((f) => {
                  const overdue = new Date(f.dueAt) < new Date();
                  return (
                    <div key={f.id} className="flex items-center gap-3 rounded-lg border border-ink-200 p-3">
                      <CalendarClock className={`h-4 w-4 ${overdue ? "text-red-500" : "text-ink-400"}`} />
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-ink-800">
                          {f.type} · {f.purpose ?? "Follow-up"}
                        </p>
                        <p className={`text-xs ${overdue ? "font-medium text-red-600" : "text-ink-400"}`}>
                          {overdue ? "Overdue — " : "Due "}
                          {formatDateTime(f.dueAt)} · {f.assignedTo?.name ?? "Unassigned"}
                        </p>
                      </div>
                      <CompleteFollowUpButton followUpId={f.id} />
                    </div>
                  );
                })}
                {lead.siteVisits.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-lg border border-ink-200 p-3">
                    <MapPin className="h-4 w-4 text-ink-400" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-ink-800">
                        {v.property?.title ?? "Site visit"} · <span className="text-ink-500">{v.status}</span>
                      </p>
                      <p className="text-xs text-ink-400">
                        {formatDateTime(v.scheduledAt)} · {v.assignedTo?.name ?? "Unassigned"}
                        {v.interested && ` · Interested: ${v.interested}`}
                      </p>
                    </div>
                    {["Scheduled", "Confirmed", "Rescheduled"].includes(v.status) && (
                      <SiteVisitFeedbackButton visitId={v.id} />
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          <Card>
            <CardBody>
              <StatRow
                items={[
                  {
                    label: "Assigned to",
                    value: lead.assignedTo ? (
                      <span className="flex items-center gap-1.5">
                        <Avatar name={lead.assignedTo.name} color={lead.assignedTo.avatarColor} size={18} />
                        {lead.assignedTo.name}
                      </span>
                    ) : (
                      "Unassigned"
                    ),
                  },
                  { label: "Created by", value: lead.createdBy?.name ?? "—" },
                  { label: "Source", value: lead.source?.name ?? "—" },
                  { label: "Channel partner", value: lead.channelPartner?.name ?? "—" },
                  { label: "Last activity", value: relativeTime(lead.lastActivityAt) },
                  { label: "Lead type", value: lead.leadType },
                ]}
              />
              {lead.deals.length > 0 && (
                <>
                  <Divider label="Deals" />
                  {lead.deals.map((d) => (
                    <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm hover:bg-ink-100">
                      <span className="font-medium text-ink-800">{d.code}</span>
                      <span className="text-ink-500">{d.stage} · {inr(d.value)}</span>
                    </Link>
                  ))}
                </>
              )}
              {lead.lostReason && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  Lost: {lead.lostReason}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity timeline" />
            <CardBody className="max-h-[640px] overflow-y-auto scroll-thin">
              <Timeline items={lead.activities} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
