"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ownerSchema, contactSchema } from "@/lib/validation";
import { ActionState, fail, ok, fromZod, formToObject } from "@/lib/action-result";
import { logAudit } from "@/lib/activity";
import { normalizePhone } from "@/lib/utils";

// ── Owners ──────────────────────────────────────────────────────────────────
export async function createOwner(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = ownerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const dupe = await db.owner.findFirst({ where: { phone: { endsWith: normalizePhone(d.phone) } } });
  if (dupe && fd.get("confirmDuplicate") !== "1") {
    return fail(`An owner with this number already exists (${dupe.name}). Submit again to add anyway.`, { phone: "Possible duplicate" });
  }

  const owner = await db.owner.create({
    data: {
      name: d.name,
      phone: d.phone,
      whatsapp: d.whatsapp || null,
      email: d.email || null,
      preferredContact: d.preferredContact,
      relationshipStatus: d.relationshipStatus,
      notes: d.notes || null,
      createdById: user.id,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", entity: "Owner", entityId: owner.id });
  revalidatePath("/owners");
  return ok("Owner added", { id: owner.id });
}

export async function updateOwner(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = ownerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  await db.owner.update({
    where: { id },
    data: {
      name: d.name,
      phone: d.phone,
      whatsapp: d.whatsapp || null,
      email: d.email || null,
      preferredContact: d.preferredContact,
      relationshipStatus: d.relationshipStatus,
      notes: d.notes || null,
    },
  });
  await logAudit({ userId: user.id, action: "UPDATE", entity: "Owner", entityId: id });
  revalidatePath(`/owners/${id}`);
  revalidatePath("/owners");
  return ok("Owner updated", { id });
}

export async function logOwnerContact(id: string): Promise<ActionState> {
  await requireUser();
  await db.owner.update({ where: { id }, data: { lastContactedAt: new Date() } });
  revalidatePath(`/owners/${id}`);
  return ok("Marked as contacted today");
}

// ── Contacts ────────────────────────────────────────────────────────────────
export async function createContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = contactSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const dupe = await db.contact.findFirst({ where: { phone: { endsWith: normalizePhone(d.phone) } } });
  if (dupe) {
    return fail(`A contact with this phone number already exists (${dupe.name}).`, { phone: "Duplicate — open the existing contact instead" });
  }

  const contact = await db.contact.create({
    data: {
      name: d.name,
      phone: d.phone,
      altPhone: d.altPhone || null,
      whatsapp: d.whatsapp || null,
      email: d.email || null,
      type: d.type,
      notes: d.notes || null,
      createdById: user.id,
    },
  });
  revalidatePath("/contacts");
  return ok("Contact added", { id: contact.id });
}

export async function updateContact(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = contactSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  await db.contact.update({
    where: { id },
    data: {
      name: d.name,
      phone: d.phone,
      altPhone: d.altPhone || null,
      whatsapp: d.whatsapp || null,
      email: d.email || null,
      type: d.type,
      notes: d.notes || null,
    },
  });
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");
  return ok("Contact updated", { id });
}
