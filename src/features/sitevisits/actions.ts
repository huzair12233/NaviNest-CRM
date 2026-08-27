"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { siteVisitSchema, siteVisitFeedbackSchema } from "@/lib/validation";
import { ActionState, fail, ok, fromZod, formToObject } from "@/lib/action-result";

export async function scheduleSiteVisit(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = siteVisitSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const lead = await db.lead.findUnique({ where: { id: d.leadId } });
  if (!lead) return fail("Lead not found");
  const property = d.propertyId ? await db.property.findUnique({ where: { id: d.propertyId } }) : null;

  const visit = await db.siteVisit.create({
    data: {
      leadId: d.leadId,
      propertyId: d.propertyId || null,
      assignedToId: d.assignedToId || lead.assignedToId || user.id,
      scheduledAt: d.scheduledAt,
      location: d.location || property?.location || null,
      status: d.status,
      createdById: user.id,
    },
  });

  await db.$transaction([
    db.activity.create({
      data: {
        type: "SITE_VISIT_SCHEDULED",
        summary: `Site visit scheduled for ${d.scheduledAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}${property ? ` — ${property.title}` : ""}`,
        leadId: d.leadId,
        propertyId: d.propertyId || null,
        userId: user.id,
      },
    }),
    db.lead.update({
      where: { id: d.leadId },
      data: { lastActivityAt: new Date(), status: "Site Visit Scheduled" },
    }),
  ]);

  revalidatePath(`/leads/${d.leadId}`);
  revalidatePath("/site-visits");
  revalidatePath("/dashboard");
  return ok("Site visit scheduled", { id: visit.id });
}

export async function recordSiteVisitFeedback(
  visitId: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = siteVisitFeedbackSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const visit = await db.siteVisit.findUnique({ where: { id: visitId }, include: { property: true } });
  if (!visit) return fail("Site visit not found");

  await db.siteVisit.update({
    where: { id: visitId },
    data: {
      status: d.status,
      interested: d.interested ?? null,
      rating: d.rating ?? null,
      liked: d.liked,
      disliked: d.disliked,
      objections: d.objections,
      priceFeedback: d.priceFeedback,
      competitor: d.competitor,
      nextAction: d.nextAction,
      feedbackAt: d.status === "Completed" ? new Date() : null,
    },
  });

  if (d.status === "Completed") {
    const parts = [
      d.interested && `Interested: ${d.interested}`,
      d.rating && `Rating: ${d.rating}/5`,
      d.liked && `Liked: ${d.liked}`,
      d.disliked && `Concern: ${d.disliked}`,
    ].filter(Boolean);
    await db.$transaction([
      db.activity.create({
        data: {
          type: "SITE_VISIT_FEEDBACK",
          summary: `Visit feedback${visit.property ? ` (${visit.property.title})` : ""} — ${parts.join(" · ") || "recorded"}`,
          leadId: visit.leadId,
          propertyId: visit.propertyId,
          userId: user.id,
        },
      }),
      db.lead.update({
        where: { id: visit.leadId },
        data: {
          lastActivityAt: new Date(),
          status: d.interested === "No" ? "Follow-up" : "Site Visit Completed",
        },
      }),
    ]);

    if (d.nextFollowUpAt) {
      await db.followUp.create({
        data: {
          leadId: visit.leadId,
          assignedToId: visit.assignedToId,
          dueAt: d.nextFollowUpAt,
          type: "SiteVisitFollowUp",
          purpose: d.nextAction || "Post-visit follow-up",
          createdById: user.id,
        },
      });
    }
  }

  revalidatePath(`/leads/${visit.leadId}`);
  revalidatePath("/site-visits");
  revalidatePath("/dashboard");
  return ok("Feedback saved");
}

export async function updateSiteVisitStatus(visitId: string, status: string): Promise<ActionState> {
  await requireUser();
  const visit = await db.siteVisit.findUnique({ where: { id: visitId } });
  if (!visit) return fail("Not found");
  await db.siteVisit.update({ where: { id: visitId }, data: { status } });
  revalidatePath(`/leads/${visit.leadId}`);
  revalidatePath("/site-visits");
  return ok(`Marked ${status}`);
}
