"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isManager } from "@/lib/rbac";
import { dealSchema, dealStageSchema, commissionSchema } from "@/lib/validation";
import { ActionState, fail, ok, fromZod, formToObject } from "@/lib/action-result";
import { logActivity, logAudit, notify } from "@/lib/activity";
import { PIPELINE_STAGES } from "@/lib/constants";

function stageProbability(stage: string) {
  return PIPELINE_STAGES.find((s) => s.key === stage)?.probability ?? 20;
}

async function nextDealCode() {
  const count = await db.deal.count();
  return `NN-D${String(count + 1).padStart(4, "0")}`;
}

export async function createDeal(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = dealSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const lead = d.leadId ? await db.lead.findUnique({ where: { id: d.leadId } }) : null;
  const property = d.propertyId ? await db.property.findUnique({ where: { id: d.propertyId } }) : null;

  const deal = await db.deal.create({
    data: {
      code: await nextDealCode(),
      title: d.title,
      leadId: d.leadId || null,
      propertyId: d.propertyId || null,
      contactId: d.contactId || null,
      ownerId: d.ownerId || property?.ownerId || null,
      type: d.type,
      value: d.value || property?.salePrice || (property?.rent ? property.rent * 12 : 0),
      stage: d.stage,
      probability: d.probability ?? stageProbability(d.stage),
      expectedCloseDate: d.expectedCloseDate ?? null,
      assignedToId: d.assignedToId || lead?.assignedToId || user.id,
      notes: d.notes || null,
    },
  });

  await logActivity({
    type: "DEAL_CREATED",
    summary: `Deal ${deal.code} created at ${d.stage}`,
    leadId: d.leadId || null,
    propertyId: d.propertyId || null,
    dealId: deal.id,
    userId: user.id,
  });
  await logAudit({ userId: user.id, action: "CREATE", entity: "Deal", entityId: deal.id });

  revalidatePath("/pipeline");
  revalidatePath("/deals");
  return ok("Deal created", { id: deal.id });
}

export async function changeDealStage(dealId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = dealStageSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  return applyStage(dealId, parsed.data.stage, parsed.data.lostReason, user.id);
}

export async function moveDealStage(dealId: string, stage: string): Promise<ActionState> {
  const user = await requireUser();
  return applyStage(dealId, stage, undefined, user.id);
}

async function applyStage(dealId: string, stage: string, lostReason: string | undefined, userId: string): Promise<ActionState> {
  const deal = await db.deal.findUnique({ where: { id: dealId }, include: { property: true, lead: true } });
  if (!deal) return fail("Deal not found");
  if (deal.stage === stage) return ok("No change");

  const won = stage === "Closed Won";
  const lost = stage === "Closed Lost";

  await db.deal.update({
    where: { id: dealId },
    data: {
      stage,
      probability: stageProbability(stage),
      closedAt: won || lost ? new Date() : null,
      lostReason: lost ? lostReason || "Not specified" : null,
    },
  });

  await logActivity({
    type: won || lost ? "DEAL_CLOSED" : "DEAL_STAGE_CHANGED",
    summary: won
      ? `Deal ${deal.code} won 🎉`
      : lost
        ? `Deal ${deal.code} lost — ${lostReason || "not specified"}`
        : `Deal ${deal.code}: ${deal.stage} → ${stage}`,
    leadId: deal.leadId,
    propertyId: deal.propertyId,
    dealId,
    userId,
  });
  await logAudit({ userId, action: "STATUS_CHANGE", entity: "Deal", entityId: dealId, field: "stage", oldValue: deal.stage, newValue: stage });

  if (won) {
    // roll the whole workflow forward
    if (deal.propertyId) {
      await db.property.update({
        where: { id: deal.propertyId },
        data: { status: deal.type === "RENT" ? "Rented" : "Sold" },
      });
    }
    if (deal.leadId) {
      await db.lead.update({ where: { id: deal.leadId }, data: { status: "Converted", lastActivityAt: new Date() } });
    }
    const existing = await db.commission.findUnique({ where: { dealId } });
    if (!existing) {
      const pct = deal.type === "RENT" ? 1 : 1.5;
      await db.commission.create({
        data: {
          dealId,
          dealValue: deal.value,
          percentage: pct,
          expectedAmount: Math.round((deal.value * pct) / 100),
          employeeSharePct: 30,
          companySharePct: 70,
          status: "Pending",
        },
      });
      await logActivity({ type: "COMMISSION_UPDATED", summary: `Commission record opened for ${deal.code}`, dealId, leadId: deal.leadId, userId });
    }
  } else if (lost && deal.propertyId && deal.property?.status === "UnderNegotiation") {
    await db.property.update({ where: { id: deal.propertyId }, data: { status: "Available" } });
  } else if (["Negotiation", "Token", "Booked"].includes(stage) && deal.propertyId) {
    await db.property.update({ where: { id: deal.propertyId }, data: { status: "UnderNegotiation" } });
  }

  if (won && deal.assignedToId && deal.assignedToId !== userId) {
    await notify({ userId: deal.assignedToId, type: "DEAL_UPDATED", title: `Deal ${deal.code} marked won`, link: `/deals/${dealId}` });
  }

  revalidatePath("/pipeline");
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/commissions");
  revalidatePath("/dashboard");
  if (deal.leadId) revalidatePath(`/leads/${deal.leadId}`);
  return ok(won ? "Deal won 🎉" : lost ? "Deal marked lost" : `Moved to ${stage}`);
}

export async function updateDeal(dealId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = dealSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  await db.deal.update({
    where: { id: dealId },
    data: {
      title: d.title,
      type: d.type,
      value: d.value,
      probability: d.probability ?? stageProbability(d.stage),
      expectedCloseDate: d.expectedCloseDate ?? null,
      notes: d.notes || null,
      leadId: d.leadId || null,
      propertyId: d.propertyId || null,
      contactId: d.contactId || null,
      ownerId: d.ownerId || null,
      ...(isManager(user) && d.assignedToId ? { assignedToId: d.assignedToId } : {}),
    },
  });
  await logActivity({ type: "DEAL_STAGE_CHANGED", summary: `Deal ${d.title} details updated`, dealId, userId: user.id });
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  return ok("Deal updated", { id: dealId });
}

export async function updateCommission(dealId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!isManager(user)) return fail("Only managers can edit commission");
  const parsed = commissionSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const expected = Math.round((d.dealValue * d.percentage) / 100);
  const status = d.receivedAmount === 0 ? "Pending" : d.receivedAmount >= expected ? "Received" : "Partial";

  await db.commission.upsert({
    where: { dealId },
    update: {
      dealValue: d.dealValue,
      percentage: d.percentage,
      expectedAmount: expected,
      receivedAmount: d.receivedAmount,
      paymentDate: d.paymentDate ?? null,
      employeeSharePct: d.employeeSharePct,
      companySharePct: 100 - d.employeeSharePct,
      status,
      notes: d.notes || null,
    },
    create: {
      dealId,
      dealValue: d.dealValue,
      percentage: d.percentage,
      expectedAmount: expected,
      receivedAmount: d.receivedAmount,
      paymentDate: d.paymentDate ?? null,
      employeeSharePct: d.employeeSharePct,
      companySharePct: 100 - d.employeeSharePct,
      status,
      notes: d.notes || null,
    },
  });

  const deal = await db.deal.findUnique({ where: { id: dealId } });
  await logActivity({
    type: "COMMISSION_UPDATED",
    summary: `Commission updated — ${status} (${d.percentage}% of deal)`,
    dealId,
    leadId: deal?.leadId ?? null,
    userId: user.id,
  });

  revalidatePath("/commissions");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  return ok("Commission updated");
}
