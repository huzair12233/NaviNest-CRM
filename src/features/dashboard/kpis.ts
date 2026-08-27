import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, startOfWeek, startOfMonth } from "@/lib/utils";
import { OPEN_LEAD_STATUSES } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { leadScope, followUpScope, siteVisitScope, dealScope } from "@/lib/rbac";

export async function getDashboardData(user: SessionUser) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const lScope = leadScope(user);
  const fScope = followUpScope(user);
  const sScope = siteVisitScope(user);
  const dScope = dealScope(user);

  const openLead: Prisma.LeadWhereInput = { AND: [lScope, { status: { in: [...OPEN_LEAD_STATUSES] } }] };

  const [
    totalLeads,
    newToday,
    newWeek,
    newMonth,
    activeLeads,
    hotLeads,
    warmLeads,
    followupsToday,
    overdueFollowups,
    visitsToday,
    upcomingVisits,
    activeSale,
    activeRental,
    availableProps,
    negotiationProps,
    openDeals,
    closedThisMonth,
    commissionAgg,
    receivedAgg,
    pipelineValue,
  ] = await Promise.all([
    db.lead.count({ where: lScope }),
    db.lead.count({ where: { AND: [lScope, { createdAt: { gte: todayStart } }] } }),
    db.lead.count({ where: { AND: [lScope, { createdAt: { gte: weekStart } }] } }),
    db.lead.count({ where: { AND: [lScope, { createdAt: { gte: monthStart } }] } }),
    db.lead.count({ where: openLead }),
    db.lead.count({ where: { AND: [openLead, { temperature: "Hot" }] } }),
    db.lead.count({ where: { AND: [openLead, { temperature: "Warm" }] } }),
    db.followUp.count({ where: { AND: [fScope, { status: "Pending", dueAt: { gte: todayStart, lte: todayEnd } }] } }),
    db.followUp.count({ where: { AND: [fScope, { status: "Pending", dueAt: { lt: todayStart } }] } }),
    db.siteVisit.count({ where: { AND: [sScope, { status: { in: ["Scheduled", "Confirmed"] }, scheduledAt: { gte: todayStart, lte: todayEnd } }] } }),
    db.siteVisit.count({ where: { AND: [sScope, { status: { in: ["Scheduled", "Confirmed"] }, scheduledAt: { gt: todayEnd } }] } }),
    db.lead.count({ where: { AND: [openLead, { interest: { in: ["SALE", "BOTH"] } }] } }),
    db.lead.count({ where: { AND: [openLead, { interest: { in: ["RENT", "BOTH"] } }] } }),
    db.property.count({ where: { status: "Available" } }),
    db.property.count({ where: { status: "UnderNegotiation" } }),
    db.deal.count({ where: { AND: [dScope, { stage: { notIn: ["Closed Won", "Closed Lost"] } }] } }),
    db.deal.count({ where: { AND: [dScope, { stage: "Closed Won", closedAt: { gte: monthStart } }] } }),
    db.commission.aggregate({ _sum: { expectedAmount: true, receivedAmount: true } }),
    db.commission.aggregate({ _sum: { receivedAmount: true }, where: { paymentDate: { gte: monthStart } } }),
    db.deal.aggregate({ _sum: { value: true }, where: { AND: [dScope, { stage: { notIn: ["Closed Won", "Closed Lost"] } }] } }),
  ]);

  const expectedComm = commissionAgg._sum.expectedAmount ?? 0;
  const receivedComm = commissionAgg._sum.receivedAmount ?? 0;

  return {
    kpis: {
      totalLeads,
      newToday,
      newWeek,
      newMonth,
      activeLeads,
      hotLeads,
      warmLeads,
      followupsToday,
      overdueFollowups,
      visitsToday,
      upcomingVisits,
      activeSale,
      activeRental,
      availableProps,
      negotiationProps,
      openDeals,
      closedThisMonth,
      pipelineValue: pipelineValue._sum.value ?? 0,
      expectedComm,
      receivedComm,
      pendingComm: Math.max(0, expectedComm - receivedComm),
      monthComm: receivedAgg._sum.receivedAmount ?? 0,
    },
  };
}

export async function getLeadTrend(user: SessionUser, weeks = 10) {
  const scope = leadScope(user);
  const start = startOfWeek(new Date());
  start.setDate(start.getDate() - (weeks - 1) * 7);
  const leads = await db.lead.findMany({
    where: { AND: [scope, { createdAt: { gte: start } }] },
    select: { createdAt: true, status: true },
  });
  const buckets: { label: string; leads: number; won: number }[] = [];
  for (let i = 0; i < weeks; i++) {
    const from = new Date(start);
    from.setDate(from.getDate() + i * 7);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    buckets.push({
      label: from.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      leads: leads.filter((l) => l.createdAt >= from && l.createdAt < to).length,
      won: leads.filter((l) => l.createdAt >= from && l.createdAt < to && l.status === "Converted").length,
    });
  }
  return buckets;
}

export async function getLeadBySource(user: SessionUser) {
  const scope = leadScope(user);
  const rows = await db.lead.groupBy({
    by: ["sourceId"],
    where: scope,
    _count: { _all: true },
  });
  const sources = await db.leadSource.findMany();
  return rows
    .map((r) => ({
      name: sources.find((s) => s.id === r.sourceId)?.name ?? "Unknown",
      value: r._count._all,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export async function getLeadByStatus(user: SessionUser) {
  const scope = leadScope(user);
  const rows = await db.lead.groupBy({ by: ["status"], where: scope, _count: { _all: true } });
  return rows.map((r) => ({ name: r.status, value: r._count._all }));
}

export async function getPipelineFunnel(user: SessionUser) {
  const scope = dealScope(user);
  const rows = await db.deal.groupBy({
    by: ["stage"],
    where: scope,
    _count: { _all: true },
    _sum: { value: true },
  });
  return rows;
}
