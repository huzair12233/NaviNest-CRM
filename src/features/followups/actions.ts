"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { followUpSchema, followUpCompleteSchema } from "@/lib/validation";
import { ActionState, fail, ok, fromZod, formToObject } from "@/lib/action-result";
import { logActivity, notify } from "@/lib/activity";

export async function createFollowUp(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = followUpSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const lead = await db.lead.findUnique({ where: { id: d.leadId } });
  if (!lead) return fail("Lead not found");

  const assignedToId = d.assignedToId || lead.assignedToId || user.id;
  const fu = await db.followUp.create({
    data: {
      leadId: d.leadId,
      assignedToId,
      dueAt: d.dueAt,
      type: d.type,
      purpose: d.purpose,
      notes: d.notes,
      priority: d.priority,
      createdById: user.id,
    },
  });

  await db.$transaction([
    db.activity.create({
      data: {
        type: "FOLLOWUP_CREATED",
        summary: `Follow-up (${d.type}) scheduled for ${d.dueAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}${d.purpose ? ` — ${d.purpose}` : ""}`,
        leadId: d.leadId,
        userId: user.id,
      },
    }),
    db.lead.update({
      where: { id: d.leadId },
      data: {
        lastActivityAt: new Date(),
        ...(lead.status === "New" || lead.status === "Contacted" ? { status: "Follow-up" } : {}),
      },
    }),
  ]);

  if (assignedToId !== user.id) {
    await notify({ userId: assignedToId, type: "FOLLOWUP_DUE", title: `Follow-up assigned: ${lead.fullName}`, link: `/leads/${d.leadId}` });
  }

  revalidatePath(`/leads/${d.leadId}`);
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  return ok("Follow-up scheduled", { id: fu.id });
}

export async function completeFollowUp(followUpId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = followUpCompleteSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const fu = await db.followUp.findUnique({ where: { id: followUpId }, include: { lead: true } });
  if (!fu) return fail("Follow-up not found");

  await db.followUp.update({
    where: { id: followUpId },
    data: {
      status: d.status,
      outcome: d.outcome,
      completedAt: new Date(),
      nextFollowUpAt: d.nextFollowUpAt ?? null,
    },
  });

  await db.$transaction([
    db.activity.create({
      data: {
        type: "FOLLOWUP_COMPLETED",
        summary: `Follow-up (${fu.type}) completed — ${d.outcome}`,
        leadId: fu.leadId,
        userId: user.id,
      },
    }),
    db.lead.update({ where: { id: fu.leadId }, data: { lastActivityAt: new Date() } }),
  ]);

  if (d.nextFollowUpAt) {
    await db.followUp.create({
      data: {
        leadId: fu.leadId,
        assignedToId: fu.assignedToId,
        dueAt: d.nextFollowUpAt,
        type: d.nextType ?? "Call",
        purpose: "Continued follow-up",
        priority: fu.priority,
        createdById: user.id,
      },
    });
    await db.activity.create({
      data: {
        type: "FOLLOWUP_CREATED",
        summary: `Next follow-up scheduled for ${d.nextFollowUpAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`,
        leadId: fu.leadId,
        userId: user.id,
      },
    });
  }

  revalidatePath(`/leads/${fu.leadId}`);
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  return ok("Follow-up completed");
}

export async function cancelFollowUp(followUpId: string): Promise<ActionState> {
  const user = await requireUser();
  const fu = await db.followUp.findUnique({ where: { id: followUpId } });
  if (!fu) return fail("Not found");
  await db.followUp.update({ where: { id: followUpId }, data: { status: "Cancelled" } });
  await logActivity({ type: "FOLLOWUP_COMPLETED", summary: "Follow-up cancelled", leadId: fu.leadId, userId: user.id });
  revalidatePath(`/leads/${fu.leadId}`);
  revalidatePath("/follow-ups");
  return ok("Follow-up cancelled");
}
