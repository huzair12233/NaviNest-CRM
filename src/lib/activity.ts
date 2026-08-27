import "server-only";
import { db } from "./db";

type ActivityInput = {
  type: string;
  summary: string;
  userId?: string | null;
  leadId?: string | null;
  propertyId?: string | null;
  dealId?: string | null;
  meta?: Record<string, unknown>;
};

export async function logActivity(input: ActivityInput) {
  return db.activity.create({
    data: {
      type: input.type,
      summary: input.summary,
      userId: input.userId ?? null,
      leadId: input.leadId ?? null,
      propertyId: input.propertyId ?? null,
      dealId: input.dealId ?? null,
      meta: input.meta ? (input.meta as object) : undefined,
    },
  });
}

type AuditInput = {
  userId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "ASSIGN";
  entity: string;
  entityId: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
};

export async function logAudit(input: AuditInput) {
  return db.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      field: input.field ?? null,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
    },
  });
}

/** Diff two records and write one audit row per changed tracked field. */
export async function auditDiff(
  userId: string | null | undefined,
  entity: string,
  entityId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
) {
  const rows: AuditInput[] = [];
  for (const f of fields) {
    const o = before[f];
    const n = after[f];
    if (o === n) continue;
    if (o == null && n == null) continue;
    rows.push({
      userId,
      action: f === "status" || f === "stage" ? "STATUS_CHANGE" : "UPDATE",
      entity,
      entityId,
      field: f,
      oldValue: o == null ? null : String(o),
      newValue: n == null ? null : String(n),
    });
  }
  if (rows.length) await db.auditLog.createMany({ data: rows });
}

export async function notify(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });
}
