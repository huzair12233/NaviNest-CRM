import "server-only";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { callListScope } from "@/lib/rbac";
import { getParam, type SearchParams } from "@/lib/pagination";
import { normalizePhone } from "@/lib/utils";

export async function getCallListEntries(user: SessionUser, sp: SearchParams) {
  const status = getParam(sp, "status") ?? "Pending";
  const scope = callListScope(user);
  const where = status === "All" ? scope : { AND: [scope, { status }] };

  const [rows, counts, existingLeadPhones] = await Promise.all([
    db.callListEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { assignedTo: { select: { name: true, avatarColor: true } }, lead: { select: { id: true, code: true } } },
    }),
    Promise.all(
      ["Pending", "Called", "Skipped", "Converted"].map((s) =>
        db.callListEntry.count({ where: { AND: [scope, { status: s }] } }),
      ),
    ),
    db.lead.findMany({ select: { id: true, code: true, phone: true } }),
  ]);

  const leadByPhone = new Map(existingLeadPhones.map((l) => [normalizePhone(l.phone), l]));
  const enriched = rows.map((r) => ({
    ...r,
    existingLead: r.lead ?? leadByPhone.get(normalizePhone(r.phone)) ?? null,
  }));

  return {
    rows: enriched,
    status,
    counts: { Pending: counts[0], Called: counts[1], Skipped: counts[2], Converted: counts[3] },
  };
}
