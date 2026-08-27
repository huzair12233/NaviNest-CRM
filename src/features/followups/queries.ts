import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { followUpScope } from "@/lib/rbac";
import { startOfDay, endOfDay } from "@/lib/utils";
import { getParam, type SearchParams } from "@/lib/pagination";

export type FollowUpTab = "today" | "overdue" | "upcoming" | "completed";

export async function getFollowUps(user: SessionUser, sp: SearchParams) {
  const tab = (getParam(sp, "tab") as FollowUpTab) ?? "today";
  const scope = followUpScope(user);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const filters: Record<FollowUpTab, Prisma.FollowUpWhereInput> = {
    today: { status: "Pending", dueAt: { gte: todayStart, lte: todayEnd } },
    overdue: { status: "Pending", dueAt: { lt: todayStart } },
    upcoming: { status: "Pending", dueAt: { gt: todayEnd } },
    completed: { status: { in: ["Completed", "Cancelled"] } },
  };

  const assignee = getParam(sp, "assignedToId");
  const type = getParam(sp, "type");
  const where: Prisma.FollowUpWhereInput = {
    AND: [scope, filters[tab], assignee ? { assignedToId: assignee } : {}, type ? { type } : {}],
  };

  const [rows, counts] = await Promise.all([
    db.followUp.findMany({
      where,
      orderBy: tab === "completed" ? { completedAt: "desc" } : { dueAt: tab === "upcoming" ? "asc" : "asc" },
      take: 200,
      include: {
        assignedTo: { select: { name: true, avatarColor: true } },
        lead: { select: { id: true, code: true, fullName: true, phone: true, status: true, temperature: true } },
      },
    }),
    Promise.all(
      (["today", "overdue", "upcoming", "completed"] as FollowUpTab[]).map((t) =>
        db.followUp.count({ where: { AND: [scope, filters[t]] } }),
      ),
    ),
  ]);

  return {
    tab,
    rows,
    counts: { today: counts[0], overdue: counts[1], upcoming: counts[2], completed: counts[3] },
  };
}
