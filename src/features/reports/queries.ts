import "server-only";
import { db } from "@/lib/db";
import { daysBetween, startOfDay } from "@/lib/utils";
import { AGEING_BUCKETS } from "@/lib/constants";

const QUALIFIED_PLUS = [
  "Qualified", "Requirement Captured", "Property Shared", "Follow-up",
  "Site Visit Scheduled", "Site Visit Completed", "Negotiation", "Token / Booking", "Converted",
];

export async function sourceAttribution() {
  const sources = await db.leadSource.findMany({ orderBy: { sortkey: "asc" } });
  const leads = await db.lead.findMany({
    select: { id: true, sourceId: true, status: true },
  });
  const visitLeadIds = new Set(
    (await db.siteVisit.findMany({ select: { leadId: true } })).map((v) => v.leadId),
  );
  const dealsByLead = await db.deal.findMany({ select: { leadId: true, stage: true, value: true } });

  return sources
    .map((s) => {
      const own = leads.filter((l) => l.sourceId === s.id);
      const qualified = own.filter((l) => QUALIFIED_PLUS.includes(l.status)).length;
      const visits = own.filter((l) => visitLeadIds.has(l.id)).length;
      const won = dealsByLead.filter((d) => d.stage === "Closed Won" && own.some((l) => l.id === d.leadId));
      return {
        source: s.name,
        category: s.category,
        leads: own.length,
        qualified,
        visits,
        deals: won.length,
        value: won.reduce((sum, d) => sum + d.value, 0),
        conversion: own.length ? Math.round((won.length / own.length) * 1000) / 10 : 0,
      };
    })
    .filter((r) => r.leads > 0)
    .sort((a, b) => b.leads - a.leads);
}

export async function teamPerformance() {
  const users = await db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const [leads, visits, deals, commissions] = await Promise.all([
    db.lead.groupBy({ by: ["assignedToId"], _count: { _all: true } }),
    db.siteVisit.groupBy({ by: ["assignedToId"], _count: { _all: true } }),
    db.deal.findMany({ select: { assignedToId: true, stage: true, value: true } }),
    db.commission.findMany({ select: { expectedAmount: true, receivedAmount: true, deal: { select: { assignedToId: true } } } }),
  ]);

  return users.map((u) => {
    const uDeals = deals.filter((d) => d.assignedToId === u.id);
    const won = uDeals.filter((d) => d.stage === "Closed Won");
    const uComm = commissions.filter((c) => c.deal.assignedToId === u.id);
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      color: u.avatarColor,
      leads: leads.find((l) => l.assignedToId === u.id)?._count._all ?? 0,
      visits: visits.find((v) => v.assignedToId === u.id)?._count._all ?? 0,
      openDeals: uDeals.filter((d) => !d.stage.startsWith("Closed")).length,
      wonDeals: won.length,
      wonValue: won.reduce((s, d) => s + d.value, 0),
      commissionExpected: uComm.reduce((s, c) => s + c.expectedAmount, 0),
      commissionReceived: uComm.reduce((s, c) => s + c.receivedAmount, 0),
    };
  });
}

export async function leadAgeing() {
  const open = await db.lead.findMany({
    where: { status: { notIn: ["Converted", "Lost", "Not Interested"] } },
    select: { lastActivityAt: true },
  });
  const today = startOfDay();
  return AGEING_BUCKETS.map((b) => ({
    name: b.label,
    value: open.filter((l) => {
      const d = daysBetween(today, startOfDay(l.lastActivityAt));
      return d >= b.min && d <= b.max;
    }).length,
  }));
}

export async function visitConversion() {
  const visits = await db.siteVisit.findMany({ select: { status: true, interested: true } });
  const completed = visits.filter((v) => v.status === "Completed");
  const interested = completed.filter((v) => v.interested === "Yes").length;
  return {
    total: visits.length,
    completed: completed.length,
    cancelled: visits.filter((v) => ["Cancelled", "NoShow"].includes(v.status)).length,
    interested,
    rate: completed.length ? Math.round((interested / completed.length) * 100) : 0,
  };
}

export async function funnelCounts() {
  const rows = await db.lead.groupBy({ by: ["status"], _count: { _all: true } });
  const total = rows.reduce((s, r) => s + r._count._all, 0);
  const won = rows.find((r) => r.status === "Converted")?._count._all ?? 0;
  return { total, won, conversion: total ? Math.round((won / total) * 1000) / 10 : 0 };
}
