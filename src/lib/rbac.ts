import type { Prisma } from "@prisma/client";
import type { SessionUser } from "./auth";

/**
 * Visibility rules:
 *  - ADMIN & MANAGER: see everything (team-wide).
 *  - SALES: see only records assigned to them (or created by them / unassigned).
 *
 * Returned as a Prisma `where` fragment to merge into list queries so the
 * database — not the client — enforces the scope.
 */
export function leadScope(user: SessionUser): Prisma.LeadWhereInput {
  if (user.role === "ADMIN" || user.role === "MANAGER") return {};
  return { OR: [{ assignedToId: user.id }, { createdById: user.id }, { assignedToId: null }] };
}

export function followUpScope(user: SessionUser): Prisma.FollowUpWhereInput {
  if (user.role === "ADMIN" || user.role === "MANAGER") return {};
  return { OR: [{ assignedToId: user.id }, { lead: { assignedToId: user.id } }] };
}

export function siteVisitScope(user: SessionUser): Prisma.SiteVisitWhereInput {
  if (user.role === "ADMIN" || user.role === "MANAGER") return {};
  return { OR: [{ assignedToId: user.id }, { lead: { assignedToId: user.id } }] };
}

export function dealScope(user: SessionUser): Prisma.DealWhereInput {
  if (user.role === "ADMIN" || user.role === "MANAGER") return {};
  return { OR: [{ assignedToId: user.id }] };
}

export function taskScope(user: SessionUser): Prisma.TaskWhereInput {
  if (user.role === "ADMIN" || user.role === "MANAGER") return {};
  return { OR: [{ assignedToId: user.id }, { createdById: user.id }] };
}

export const isManager = (u: SessionUser) => u.role === "ADMIN" || u.role === "MANAGER";
export const isAdmin = (u: SessionUser) => u.role === "ADMIN";

/** Can this user reassign records / see the team filter? */
export const canReassign = (u: SessionUser) => isManager(u);
/** Can this user manage team members, sources, settings? */
export const canManageSettings = (u: SessionUser) => isAdmin(u);
/** Can this user edit commission financials? */
export const canEditCommission = (u: SessionUser) => isManager(u);
