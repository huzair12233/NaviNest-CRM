"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isManager } from "@/lib/rbac";
import {
  leadSchema,
  leadStatusSchema,
  noteSchema,
} from "@/lib/validation";
import { ActionState, fail, ok, fromZod, formToObject } from "@/lib/action-result";
import { logActivity, logAudit, auditDiff, notify } from "@/lib/activity";
import { normalizePhone } from "@/lib/utils";
import { LEAD_STATUS_GROUP } from "@/lib/constants";

async function nextLeadCode() {
  const count = await db.lead.count();
  return `NN-L${String(count + 1).padStart(4, "0")}`;
}

/** Returns an existing lead/contact with the same phone, if any. */
export async function checkDuplicatePhone(phone: string) {
  const p = normalizePhone(phone);
  if (p.length !== 10) return null;
  const lead = await db.lead.findFirst({
    where: { phone: { endsWith: p } },
    select: { id: true, code: true, fullName: true, status: true, assignedTo: { select: { name: true } } },
  });
  if (lead) return { kind: "lead" as const, ...lead };
  const contact = await db.contact.findFirst({
    where: { phone: { endsWith: p } },
    select: { id: true, name: true, type: true },
  });
  if (contact) return { kind: "contact" as const, ...contact };
  return null;
}

export async function createLead(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = formToObject(fd);
  raw.parkingReq = fd.get("parkingReq") ? "on" : "";
  raw.loanRequired = fd.get("loanRequired") ? "on" : "";
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const dupe = await checkDuplicatePhone(d.phone);
  if (dupe && fd.get("confirmDuplicate") !== "1") {
    return fail(
      dupe.kind === "lead"
        ? `A lead with this number already exists (${dupe.code} · ${dupe.fullName}). Submit again to create anyway.`
        : `A contact with this number already exists (${dupe.name}). Submit again to create anyway.`,
      { phone: "Possible duplicate" },
    );
  }

  const assignedToId = isManager(user) && d.assignedToId ? d.assignedToId : user.id;
  const code = await nextLeadCode();

  const lead = await db.lead.create({
    data: {
      code,
      fullName: d.fullName,
      phone: d.phone,
      altPhone: d.altPhone || null,
      whatsapp: d.whatsapp || null,
      email: d.email || null,
      leadType: d.leadType,
      interest: d.interest,
      status: d.status ?? "New",
      temperature: d.temperature,
      priority: d.priority,
      propertyType: d.propertyType || null,
      bhk: d.bhk ?? null,
      locations: d.locations.join(", ") || null,
      preferredProject: d.preferredProject || null,
      budgetMin: d.budgetMin ?? null,
      budgetMax: d.budgetMax ?? null,
      areaMin: d.areaMin ?? null,
      areaMax: d.areaMax ?? null,
      rentMin: d.rentMin ?? null,
      rentMax: d.rentMax ?? null,
      depositMax: d.depositMax ?? null,
      furnishing: d.furnishing || null,
      parkingReq: d.parkingReq,
      floorPref: d.floorPref || null,
      possessionReq: d.possessionReq || null,
      moveInDate: d.moveInDate ?? null,
      loanRequired: d.loanRequired,
      occupancy: d.occupancy || null,
      requirementNotes: d.requirementNotes || null,
      sourceId: d.sourceId || null,
      channelPartnerId: d.channelPartnerId || null,
      assignedToId,
      createdById: user.id,
      lastActivityAt: new Date(),
    },
  });

  // Keep a matching contact record (dedupe by phone)
  await db.contact.upsert({
    where: { phone: d.phone },
    update: {},
    create: {
      name: d.fullName,
      phone: d.phone,
      whatsapp: d.whatsapp || null,
      email: d.email || null,
      type: d.leadType === "Tenant" ? "Tenant" : d.leadType === "Landlord" ? "Landlord" : "Buyer",
      createdById: user.id,
    },
  }).catch(() => {});

  await logActivity({
    type: "LEAD_CREATED",
    summary: `Lead created (${d.interest === "RENT" ? "rental" : "sale"} enquiry)`,
    leadId: lead.id,
    userId: user.id,
  });
  await logAudit({ userId: user.id, action: "CREATE", entity: "Lead", entityId: lead.id });

  if (assignedToId !== user.id) {
    await notify({
      userId: assignedToId,
      type: "LEAD_ASSIGNED",
      title: `New lead assigned: ${d.fullName}`,
      link: `/leads/${lead.id}`,
    });
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return ok("Lead created", { id: lead.id });
}

const TRACKED = [
  "fullName", "phone", "altPhone", "whatsapp", "email", "leadType", "interest",
  "temperature", "priority", "propertyType", "bhk", "budgetMin", "budgetMax",
  "furnishing", "occupancy",
];

export async function updateLead(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const before = await db.lead.findUnique({ where: { id } });
  if (!before) return fail("Lead not found");

  const raw = formToObject(fd);
  raw.parkingReq = fd.get("parkingReq") ? "on" : "";
  raw.loanRequired = fd.get("loanRequired") ? "on" : "";
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const updated = await db.lead.update({
    where: { id },
    data: {
      fullName: d.fullName,
      phone: d.phone,
      altPhone: d.altPhone || null,
      whatsapp: d.whatsapp || null,
      email: d.email || null,
      leadType: d.leadType,
      interest: d.interest,
      temperature: d.temperature,
      priority: d.priority,
      propertyType: d.propertyType || null,
      bhk: d.bhk ?? null,
      locations: d.locations.join(", ") || null,
      preferredProject: d.preferredProject || null,
      budgetMin: d.budgetMin ?? null,
      budgetMax: d.budgetMax ?? null,
      areaMin: d.areaMin ?? null,
      areaMax: d.areaMax ?? null,
      rentMin: d.rentMin ?? null,
      rentMax: d.rentMax ?? null,
      depositMax: d.depositMax ?? null,
      furnishing: d.furnishing || null,
      parkingReq: d.parkingReq,
      floorPref: d.floorPref || null,
      possessionReq: d.possessionReq || null,
      moveInDate: d.moveInDate ?? null,
      loanRequired: d.loanRequired,
      occupancy: d.occupancy || null,
      requirementNotes: d.requirementNotes || null,
      sourceId: d.sourceId || null,
      channelPartnerId: d.channelPartnerId || null,
      ...(isManager(user) && d.assignedToId ? { assignedToId: d.assignedToId } : {}),
    },
  });

  await auditDiff(user.id, "Lead", id, before as never, updated as never, TRACKED);
  if (before.temperature !== updated.temperature) {
    await logActivity({
      type: "TEMPERATURE_CHANGED",
      summary: `Temperature set to ${updated.temperature}`,
      leadId: id,
      userId: user.id,
    });
  }
  await logActivity({ type: "LEAD_UPDATED", summary: "Lead details updated", leadId: id, userId: user.id });

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  return ok("Lead updated", { id });
}

export async function changeLeadStatus(leadId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = leadStatusSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { status, note, lostReason } = parsed.data;

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return fail("Lead not found");
  if (lead.status === status) return ok("No change");

  await db.lead.update({
    where: { id: leadId },
    data: {
      status,
      lostReason: LEAD_STATUS_GROUP[status] === "lost" ? lostReason || "Not specified" : null,
      lastActivityAt: new Date(),
    },
  });
  await logActivity({
    type: "STATUS_CHANGED",
    summary: `Status: ${lead.status} → ${status}${note ? ` — ${note}` : ""}`,
    leadId,
    userId: user.id,
  });
  await logAudit({
    userId: user.id,
    action: "STATUS_CHANGE",
    entity: "Lead",
    entityId: leadId,
    field: "status",
    oldValue: lead.status,
    newValue: status,
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return ok(`Moved to ${status}`);
}

export async function setTemperature(leadId: string, temperature: string): Promise<ActionState> {
  const user = await requireUser();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return fail("Lead not found");
  await db.lead.update({ where: { id: leadId }, data: { temperature, lastActivityAt: new Date() } });
  await logActivity({
    type: "TEMPERATURE_CHANGED",
    summary: `Marked ${temperature}`,
    leadId,
    userId: user.id,
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return ok(`Marked ${temperature}`);
}

export async function assignLead(leadId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!isManager(user)) return fail("Only managers can reassign leads");
  const toId = String(fd.get("assignedToId") || "");
  if (!toId) return fail("Pick a team member");
  const [lead, target] = await Promise.all([
    db.lead.findUnique({ where: { id: leadId } }),
    db.user.findUnique({ where: { id: toId } }),
  ]);
  if (!lead || !target) return fail("Not found");
  await db.lead.update({ where: { id: leadId }, data: { assignedToId: toId } });
  await logActivity({ type: "ASSIGNED", summary: `Assigned to ${target.name}`, leadId, userId: user.id });
  await logAudit({ userId: user.id, action: "ASSIGN", entity: "Lead", entityId: leadId, field: "assignedToId", oldValue: lead.assignedToId, newValue: toId });
  await notify({ userId: toId, type: "LEAD_ASSIGNED", title: `Lead assigned to you: ${lead.fullName}`, link: `/leads/${leadId}` });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return ok(`Assigned to ${target.name}`);
}

export async function addLeadNote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = noteSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { leadId, type, summary } = parsed.data;
  const labels: Record<string, string> = {
    NOTE: "Note",
    CALL: "Logged a call",
    WHATSAPP: "WhatsApp",
    EMAIL: "Email",
  };
  await db.$transaction([
    db.activity.create({ data: { type, summary: `${labels[type]}: ${summary}`, leadId, userId: user.id } }),
    db.lead.update({ where: { id: leadId }, data: { lastActivityAt: new Date() } }),
  ]);
  revalidatePath(`/leads/${leadId}`);
  return ok("Added to timeline");
}

export async function shareProperty(leadId: string, propertyId: string, matchScore?: number): Promise<ActionState> {
  const user = await requireUser();
  const property = await db.property.findUnique({ where: { id: propertyId } });
  if (!property) return fail("Property not found");
  await db.propertyInterest.upsert({
    where: { leadId_propertyId: { leadId, propertyId } },
    update: { status: "SHARED", sharedAt: new Date(), matchScore },
    create: { leadId, propertyId, status: "SHARED", matchScore },
  });
  await db.$transaction([
    db.activity.create({
      data: {
        type: "PROPERTY_SHARED",
        summary: `Shared ${property.code} — ${property.title}`,
        leadId,
        propertyId,
        userId: user.id,
      },
    }),
    db.lead.update({
      where: { id: leadId },
      data: { lastActivityAt: new Date(), status: "Property Shared" },
    }),
  ]);
  revalidatePath(`/leads/${leadId}`);
  return ok(`Shared ${property.code}`);
}

export async function setInterestStatus(leadId: string, propertyId: string, status: string): Promise<ActionState> {
  await requireUser();
  await db.propertyInterest.update({
    where: { leadId_propertyId: { leadId, propertyId } },
    data: { status },
  });
  revalidatePath(`/leads/${leadId}`);
  return ok("Updated");
}
