"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { propertySchema } from "@/lib/validation";
import { ActionState, fail, ok, fromZod, formToObject } from "@/lib/action-result";
import { logActivity, logAudit } from "@/lib/activity";
import { parsePhotos, type Photo } from "@/lib/photos";
import { destroyImage } from "@/lib/cloudinary";

async function nextPropertyCode() {
  const count = await db.property.count();
  return `NN-P${String(count + 1).padStart(4, "0")}`;
}

async function resolveProject(name: string | undefined, location: string) {
  if (!name?.trim()) return null;
  const existing = await db.project.findFirst({ where: { name: name.trim() } });
  if (existing) return existing.id;
  const created = await db.project.create({
    data: { name: name.trim(), location, city: "Navi Mumbai" },
  });
  return created.id;
}

function payload(d: ReturnType<typeof propertySchema.parse>, projectId: string | null) {
  return {
    title: d.title,
    listingType: d.listingType,
    segment: d.segment,
    propertyType: d.propertyType,
    bhk: d.bhk ?? null,
    projectId,
    location: d.location,
    address: d.address || null,
    city: d.city,
    carpetArea: d.carpetArea ?? null,
    builtupArea: d.builtupArea ?? null,
    floor: d.floor ?? null,
    totalFloors: d.totalFloors ?? null,
    furnishing: d.furnishing,
    parking: d.parking,
    bathrooms: d.bathrooms ?? null,
    balcony: d.balcony ?? null,
    ageYears: d.ageYears ?? null,
    possession: d.possession,
    salePrice: d.salePrice ?? null,
    rent: d.rent ?? null,
    deposit: d.deposit ?? null,
    maintenance: d.maintenance ?? null,
    ownerId: d.ownerId || null,
    listingSource: d.listingSource,
    status: d.status,
    description: d.description || null,
    amenities: d.amenities.join(", ") || null,
  };
}

export async function createProperty(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = propertySchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  if (d.listingType === "SALE" && !d.salePrice) return fail("Sale price is required for a sale listing", { salePrice: "Required" });
  if (d.listingType === "RENT" && !d.rent) return fail("Monthly rent is required for a rental listing", { rent: "Required" });

  const projectId = await resolveProject(d.projectName, d.location);
  const property = await db.property.create({
    data: { ...payload(d, projectId), code: await nextPropertyCode(), addedById: user.id },
  });

  await logActivity({ type: "LEAD_UPDATED", summary: `Property ${property.code} added to inventory`, propertyId: property.id, userId: user.id });
  await logAudit({ userId: user.id, action: "CREATE", entity: "Property", entityId: property.id });

  revalidatePath("/properties");
  return ok("Property added", { id: property.id });
}

export async function updateProperty(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const before = await db.property.findUnique({ where: { id } });
  if (!before) return fail("Property not found");
  const parsed = propertySchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const projectId = await resolveProject(d.projectName, d.location);
  await db.property.update({ where: { id }, data: payload(d, projectId) });

  if (before.status !== d.status) {
    await logActivity({ type: "STATUS_CHANGED", summary: `Property status: ${before.status} → ${d.status}`, propertyId: id, userId: user.id });
    await logAudit({ userId: user.id, action: "STATUS_CHANGE", entity: "Property", entityId: id, field: "status", oldValue: before.status, newValue: d.status });
  }

  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
  return ok("Property updated", { id });
}

export async function setPropertyStatus(id: string, status: string): Promise<ActionState> {
  const user = await requireUser();
  const before = await db.property.findUnique({ where: { id } });
  if (!before) return fail("Not found");
  await db.property.update({ where: { id }, data: { status } });
  await logActivity({ type: "STATUS_CHANGED", summary: `Property marked ${status}`, propertyId: id, userId: user.id });
  await logAudit({ userId: user.id, action: "STATUS_CHANGE", entity: "Property", entityId: id, field: "status", oldValue: before.status, newValue: status });
  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
  return ok(`Marked ${status}`);
}

// ── Photos ──────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 20;

export async function addPropertyPhotos(id: string, incoming: Photo[]): Promise<ActionState> {
  const user = await requireUser();
  const property = await db.property.findUnique({ where: { id }, select: { photos: true } });
  if (!property) return fail("Property not found");

  const current = parsePhotos(property.photos);
  const seen = new Set(current.map((p) => p.publicId));
  const clean = incoming
    .filter((p) => p && p.url && p.publicId && !seen.has(p.publicId))
    .map((p) => ({ url: p.url, publicId: p.publicId, width: p.width, height: p.height }));
  if (!clean.length) return ok("No new photos");

  const next = [...current, ...clean].slice(0, MAX_PHOTOS);
  await db.property.update({ where: { id }, data: { photos: next } });
  await logActivity({
    type: "LEAD_UPDATED",
    summary: `${clean.length} photo${clean.length > 1 ? "s" : ""} added`,
    propertyId: id,
    userId: user.id,
  });

  revalidatePath(`/properties/${id}`);
  revalidatePath(`/properties/${id}/edit`);
  revalidatePath("/properties");
  return ok(`${clean.length} photo${clean.length > 1 ? "s" : ""} added`);
}

export async function removePropertyPhoto(id: string, publicId: string): Promise<ActionState> {
  const user = await requireUser();
  const property = await db.property.findUnique({ where: { id }, select: { photos: true } });
  if (!property) return fail("Property not found");

  const current = parsePhotos(property.photos);
  const next = current.filter((p) => p.publicId !== publicId);
  if (next.length === current.length) return ok("Already removed");

  await db.property.update({ where: { id }, data: { photos: next } });
  await destroyImage(publicId);
  await logActivity({ type: "LEAD_UPDATED", summary: "Photo removed", propertyId: id, userId: user.id });

  revalidatePath(`/properties/${id}`);
  revalidatePath(`/properties/${id}/edit`);
  revalidatePath("/properties");
  return ok("Photo removed");
}

export async function setCoverPhoto(id: string, publicId: string): Promise<ActionState> {
  await requireUser();
  const property = await db.property.findUnique({ where: { id }, select: { photos: true } });
  if (!property) return fail("Property not found");

  const current = parsePhotos(property.photos);
  const target = current.find((p) => p.publicId === publicId);
  if (!target) return fail("Photo not found");

  const next = [target, ...current.filter((p) => p.publicId !== publicId)];
  await db.property.update({ where: { id }, data: { photos: next } });

  revalidatePath(`/properties/${id}`);
  revalidatePath(`/properties/${id}/edit`);
  revalidatePath("/properties");
  return ok("Cover photo updated");
}
