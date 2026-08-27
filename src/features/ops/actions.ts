"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireRole, hashPassword } from "@/lib/auth";
import { taskSchema, userSchema } from "@/lib/validation";
import { ActionState, fail, ok, fromZod, formToObject } from "@/lib/action-result";

// ── Tasks ───────────────────────────────────────────────────────────────────
export async function createTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = taskSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  await db.task.create({
    data: {
      title: d.title,
      assignedToId: d.assignedToId || user.id,
      dueAt: d.dueAt ?? null,
      priority: d.priority,
      status: d.status,
      leadId: d.leadId || null,
      propertyId: d.propertyId || null,
      notes: d.notes || null,
      createdById: user.id,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/my-day");
  return ok("Task added");
}

export async function setTaskStatus(taskId: string, status: string): Promise<ActionState> {
  await requireUser();
  await db.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/tasks");
  revalidatePath("/my-day");
  return ok(status === "Completed" ? "Task completed" : `Marked ${status}`);
}

// ── Notifications ───────────────────────────────────────────────────────────
export async function markNotificationRead(id: string): Promise<ActionState> {
  const user = await requireUser();
  await db.notification.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  return ok();
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  return ok("All caught up");
}

// ── Lead sources (Settings) ─────────────────────────────────────────────────
export async function addLeadSource(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const name = String(fd.get("name") || "").trim();
  const category = String(fd.get("category") || "Other");
  if (!name) return fail("Name is required");
  const exists = await db.leadSource.findUnique({ where: { name } });
  if (exists) return fail("That source already exists");
  await db.leadSource.create({ data: { name, category } });
  revalidatePath("/settings");
  return ok("Source added");
}

export async function toggleLeadSource(id: string): Promise<ActionState> {
  await requireRole("ADMIN");
  const src = await db.leadSource.findUnique({ where: { id } });
  if (!src) return fail("Not found");
  await db.leadSource.update({ where: { id }, data: { active: !src.active } });
  revalidatePath("/settings");
  return ok(src.active ? "Source disabled" : "Source enabled");
}

// ── Channel partners ────────────────────────────────────────────────────────
export async function createChannelPartner(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = String(fd.get("name") || "").trim();
  const phone = String(fd.get("phone") || "").trim();
  if (!name || !phone) return fail("Name and phone are required");
  await db.channelPartner.create({
    data: {
      name,
      phone,
      company: String(fd.get("company") || "") || null,
      email: String(fd.get("email") || "") || null,
      reraId: String(fd.get("reraId") || "") || null,
      notes: String(fd.get("notes") || "") || null,
      createdById: user.id,
    },
  });
  revalidatePath("/channel-partners");
  return ok("Channel partner added");
}

// ── Projects ────────────────────────────────────────────────────────────────
export async function createProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const name = String(fd.get("name") || "").trim();
  const location = String(fd.get("location") || "").trim();
  if (!name || !location) return fail("Name and location are required");
  const exists = await db.project.findFirst({ where: { name, location } });
  if (exists) return fail("That project already exists");
  await db.project.create({
    data: {
      name,
      location,
      type: String(fd.get("type") || "Residential"),
      developer: String(fd.get("developer") || "") || null,
      city: String(fd.get("city") || "Navi Mumbai"),
    },
  });
  revalidatePath("/projects");
  return ok("Project added");
}

// ── Team (admin) ────────────────────────────────────────────────────────────
const COLORS = ["#0f766e", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#0891b2", "#65a30d"];

export async function createUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = userSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (!d.password) return fail("Password is required for a new user", { password: "Required" });
  const exists = await db.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (exists) return fail("A user with that email already exists");
  await db.user.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone || null,
      role: d.role,
      passwordHash: await hashPassword(d.password),
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    },
  });
  revalidatePath("/team");
  return ok("Team member added");
}

export async function updateUser(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = userSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  await db.user.update({
    where: { id },
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone || null,
      role: d.role,
      active: d.active,
      ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
    },
  });
  revalidatePath("/team");
  return ok("Team member updated");
}
