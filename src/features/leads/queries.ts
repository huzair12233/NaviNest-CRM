import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { leadScope } from "@/lib/rbac";
import { getParam, paginate, type SearchParams } from "@/lib/pagination";
import { LEAD_STATUS_GROUP, OPEN_LEAD_STATUSES } from "@/lib/constants";
import { daysBetween, startOfDay } from "@/lib/utils";

export type LeadListItem = Awaited<ReturnType<typeof getLeads>>["rows"][number];

export async function getLeads(
  user: SessionUser,
  sp: SearchParams,
  opts: { interest?: "SALE" | "RENT" | "HEAVY_DEPOSIT" } = {},
) {
  const { skip, take, page, pageSize } = paginate(sp);
  const and: Prisma.LeadWhereInput[] = [leadScope(user)];

  const q = getParam(sp, "q")?.trim();
  if (q) and.push({ OR: [{ fullName: { contains: q } }, { phone: { contains: q } }, { code: { contains: q } }, { email: { contains: q } }] });

  const interest = opts.interest ?? getParam(sp, "interest");
  if (interest === "SALE") and.push({ interest: { in: ["SALE", "BOTH"] } });
  else if (interest === "RENT") and.push({ interest: { in: ["RENT", "BOTH"] } });
  else if (interest === "HEAVY_DEPOSIT") and.push({ interest: "HEAVY_DEPOSIT" });

  const status = getParam(sp, "status");
  if (status) and.push({ status });

  const bucket = getParam(sp, "bucket");
  if (bucket === "open") and.push({ status: { in: [...OPEN_LEAD_STATUSES] } });
  else if (bucket === "won") and.push({ status: "Converted" });
  else if (bucket === "lost") and.push({ status: { in: ["Lost", "Not Interested"] } });

  for (const key of ["temperature", "priority", "assignedToId", "sourceId"] as const) {
    const v = getParam(sp, key);
    if (v) and.push({ [key]: v });
  }

  const location = getParam(sp, "location");
  if (location) and.push({ locations: { contains: location } });

  const bhk = getParam(sp, "bhk");
  if (bhk) and.push({ bhk: Number(bhk) });

  const age = getParam(sp, "age");
  if (age) {
    const now = new Date();
    const map: Record<string, [number, number]> = {
      today: [0, 0],
      "1-3": [1, 3],
      "4-7": [4, 7],
      "8-15": [8, 15],
      "16-30": [16, 30],
      "30+": [31, 3650],
    };
    const range = map[age];
    if (range) {
      const [minD, maxD] = range;
      and.push({
        lastActivityAt: {
          lte: new Date(now.getTime() - minD * 86400000),
          gte: new Date(now.getTime() - (maxD + 1) * 86400000),
        },
      });
    }
  }

  const sort = getParam(sp, "sort") ?? "recent";
  const orderBy: Prisma.LeadOrderByWithRelationInput =
    sort === "ageing"
      ? { lastActivityAt: "asc" }
      : sort === "name"
        ? { fullName: "asc" }
        : sort === "created"
          ? { createdAt: "desc" }
          : { lastActivityAt: "desc" };

  const where: Prisma.LeadWhereInput = { AND: and };

  const [rows, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        assignedTo: { select: { name: true, avatarColor: true } },
        source: { select: { name: true } },
        followUps: {
          where: { status: "Pending" },
          orderBy: { dueAt: "asc" },
          take: 1,
          select: { dueAt: true, type: true },
        },
      },
    }),
    db.lead.count({ where }),
  ]);

  const today = startOfDay();
  const enriched = rows.map((l) => ({
    ...l,
    ageDays: daysBetween(today, startOfDay(l.lastActivityAt)),
    nextFollowUp: l.followUps[0] ?? null,
  }));

  return { rows: enriched, total, page, pageSize };
}

export async function getLeadFilterOptions(user: SessionUser) {
  const [sources, team] = await Promise.all([
    db.leadSource.findMany({ where: { active: true }, orderBy: { sortkey: "asc" } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { sources, team, canFilterTeam: user.role !== "SALES" };
}

export function ageTone(days: number): "slate" | "amber" | "red" {
  if (days >= 8) return "red";
  if (days >= 4) return "amber";
  return "slate";
}

export function leadBucket(status: string) {
  return LEAD_STATUS_GROUP[status] ?? "open";
}
