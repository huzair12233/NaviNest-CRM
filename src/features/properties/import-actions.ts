"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { readSheet } from "@/lib/spreadsheet";
import { buildPropertyPreview, type PropertyPreviewRow } from "./import";
import { logActivity } from "@/lib/activity";
import { isValidPhone } from "@/lib/utils";

export type ParseResult =
  | { ok: true; rows: PropertyPreviewRow[]; mappedFields: string[]; total: number }
  | { ok: false; error: string };

export async function parsePropertyImportFile(_prev: ParseResult | null, fd: FormData): Promise<ParseResult> {
  await requireUser();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return { ok: false, error: "Please upload a .xlsx, .xls or .csv file." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "File is too large (max 8 MB)." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const sheet = await readSheet(buffer, file.name);
  if (!sheet.rows.length) return { ok: false, error: "No data rows found in that file." };
  if (sheet.rows.length > 300) return { ok: false, error: `That's ${sheet.rows.length} rows — please split into batches of 300 or fewer.` };

  const { mapping, mappedFields, rows } = await buildPropertyPreview(sheet);
  if (!mapping.title || !mapping.location) {
    return { ok: false, error: "Couldn't find Title and Location columns in this file. Rename your headers to e.g. \"Title\" and \"Location\" and try again." };
  }

  return { ok: true, rows, mappedFields, total: rows.length };
}

export type ImportSummary = { created: number; skipped: number; failed: number };

export async function confirmPropertyImport(rows: PropertyPreviewRow[]): Promise<{ ok: true; summary: ImportSummary } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!rows.length) return { ok: false, error: "No rows selected." };
  if (rows.length > 300) return { ok: false, error: "Please import 300 rows or fewer at a time." };

  let created = 0;
  let skipped = 0;
  let failed = 0;

  const [existing, count] = await Promise.all([
    db.property.findMany({ select: { title: true, location: true } }),
    db.property.count(),
  ]);
  const existingKeys = new Set(existing.map((p) => `${p.title.toLowerCase()}|${p.location.toLowerCase()}`));
  const seen = new Set<string>();
  let codeCounter = count;

  for (const r of rows) {
    const key = `${r.title.toLowerCase()}|${r.location.toLowerCase()}`;
    if (r.status === "invalid" || !r.title || !r.location) {
      failed++;
      continue;
    }
    if (existingKeys.has(key) || seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);

    try {
      codeCounter++;
      let ownerId: string | null = null;
      if (r.ownerName && r.ownerPhone && isValidPhone(r.ownerPhone)) {
        const owner =
          (await db.owner.findFirst({ where: { phone: r.ownerPhone } })) ??
          (await db.owner.create({ data: { name: r.ownerName, phone: r.ownerPhone, createdById: user.id } }));
        ownerId = owner.id;
      }

      let projectId: string | null = null;
      if (r.project) {
        const project = await db.project.upsert({
          where: { name_location: { name: r.project, location: r.location } },
          update: {},
          create: { name: r.project, location: r.location, city: r.city },
        });
        projectId = project.id;
      }

      const property = await db.property.create({
        data: {
          code: `NN-P${String(codeCounter).padStart(4, "0")}`,
          title: r.title,
          listingType: r.listingType,
          propertyType: r.propertyType,
          bhk: r.bhk ?? null,
          location: r.location,
          address: r.address || null,
          city: r.city,
          projectId,
          carpetArea: r.carpetArea ?? null,
          builtupArea: r.builtupArea ?? null,
          salePrice: r.salePrice ?? null,
          rent: r.rent ?? null,
          deposit: r.deposit ?? null,
          maintenance: r.maintenance ?? null,
          furnishing: r.furnishing,
          ownerId,
          description: r.notes || null,
          addedById: user.id,
        },
      });
      await logActivity({ type: "LEAD_UPDATED", summary: "Property imported from Excel", propertyId: property.id, userId: user.id });
      created++;
    } catch (e) {
      console.error("[import] property row failed:", e);
      failed++;
    }
  }

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  return { ok: true, summary: { created, skipped, failed } };
}
