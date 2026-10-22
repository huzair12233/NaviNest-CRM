"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseCallList } from "@/lib/call-list-parser";
import { isValidPhone, normalizePhone } from "@/lib/utils";
import { ActionState, fail, ok } from "@/lib/action-result";
import { logActivity } from "@/lib/activity";

export async function parseAndSaveCallList(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = String(fd.get("text") || "");
  if (!raw.trim()) return fail("Paste a list first.");

  const parsed = parseCallList(raw);
  if (!parsed.length) return fail("Couldn't find any phone numbers in that text.");
  if (parsed.length > 500) return fail(`That's ${parsed.length} numbers — please paste 500 or fewer at a time.`);

  await db.callListEntry.createMany({
    data: parsed.map((r) => ({
      name: r.name || null,
      phone: r.phone,
      remark: r.remark || null,
      assignedToId: user.id,
      createdById: user.id,
    })),
  });

  revalidatePath("/call-list");
  return ok(`Added ${parsed.length} number${parsed.length > 1 ? "s" : ""} to your call list`);
}

export async function updateCallListEntry(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const name = String(fd.get("name") || "").trim();
  const phone = String(fd.get("phone") || "").trim();
  const remark = String(fd.get("remark") || "").trim();
  if (!phone) return fail("Phone is required");

  await db.callListEntry.update({
    where: { id },
    data: { name: name || null, phone, remark: remark || null },
  });
  revalidatePath("/call-list");
  return ok("Saved");
}

export async function setCallListStatus(id: string, status: string): Promise<ActionState> {
  await requireUser();
  await db.callListEntry.update({ where: { id }, data: { status } });
  revalidatePath("/call-list");
  return ok(status === "Called" ? "Marked called" : `Marked ${status.toLowerCase()}`);
}

export async function deleteCallListEntry(id: string): Promise<ActionState> {
  await requireUser();
  await db.callListEntry.delete({ where: { id } });
  revalidatePath("/call-list");
  return ok("Removed");
}

export async function clearCallListByStatus(status: string): Promise<ActionState> {
  const user = await requireUser();
  const { count } = await db.callListEntry.deleteMany({
    where: { status, OR: [{ assignedToId: user.id }, { createdById: user.id }] },
  });
  revalidatePath("/call-list");
  return ok(`Removed ${count} entr${count === 1 ? "y" : "ies"}`);
}

async function nextLeadCode() {
  const count = await db.lead.count();
  return `NN-L${String(count + 1).padStart(4, "0")}`;
}

export async function saveCallListEntryAsLead(entryId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const entry = await db.callListEntry.findUnique({ where: { id: entryId } });
  if (!entry) return fail("Entry not found");

  const fullName = String(fd.get("fullName") || entry.name || "").trim();
  const phone = String(fd.get("phone") || entry.phone || "").trim();
  if (!fullName) return fail("Name is required");
  if (!isValidPhone(phone)) return fail("Enter a valid 10-digit mobile number");

  const existing = await db.lead.findFirst({ where: { phone: { endsWith: normalizePhone(phone) } } });
  if (existing) {
    return fail(`A lead with this number already exists (${existing.code} · ${existing.fullName}).`, { phone: "Duplicate" });
  }

  const leadType = String(fd.get("leadType") || "Buyer");
  const interest = String(fd.get("interest") || "SALE");

  const lead = await db.lead.create({
    data: {
      code: await nextLeadCode(),
      fullName,
      phone,
      leadType,
      interest,
      requirementNotes: entry.remark || null,
      assignedToId: user.id,
      createdById: user.id,
      lastActivityAt: new Date(),
    },
  });

  await db.contact
    .upsert({
      where: { phone },
      update: {},
      create: { name: fullName, phone, type: leadType === "Tenant" ? "Tenant" : "Buyer", createdById: user.id },
    })
    .catch(() => {});

  await logActivity({
    type: "LEAD_CREATED",
    summary: `Lead created from cold-call list${entry.remark ? ` — ${entry.remark}` : ""}`,
    leadId: lead.id,
    userId: user.id,
  });

  await db.callListEntry.update({ where: { id: entryId }, data: { status: "Converted", leadId: lead.id } });

  revalidatePath("/call-list");
  revalidatePath("/leads");
  return ok("Lead created", { id: lead.id });
}
