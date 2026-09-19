"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { readSheet } from "@/lib/spreadsheet";
import { buildLeadPreview, type LeadPreviewRow } from "./import";
import { logActivity } from "@/lib/activity";
import { normalizePhone } from "@/lib/utils";

export type ParseResult =
  | { ok: true; rows: LeadPreviewRow[]; mappedFields: string[]; total: number }
  | { ok: false; error: string };

export async function parseLeadImportFile(_prev: ParseResult | null, fd: FormData): Promise<ParseResult> {
  await requireUser();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return { ok: false, error: "Please upload a .xlsx, .xls or .csv file." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "File is too large (max 8 MB)." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const sheet = await readSheet(buffer, file.name);
  if (!sheet.rows.length) return { ok: false, error: "No data rows found in that file." };
  if (sheet.rows.length > 300) return { ok: false, error: `That's ${sheet.rows.length} rows — please split into batches of 300 or fewer.` };

  const { mapping, rows } = await buildLeadPreview(sheet);
  const mappedFields = Object.entries(mapping)
    .filter(([, header]) => header)
    .map(([field]) => field);

  if (!mapping.fullName || !mapping.phone) {
    return { ok: false, error: "Couldn't find Name and Phone columns in this file. Rename your headers to e.g. \"Name\" and \"Phone\" and try again." };
  }

  return { ok: true, rows, mappedFields, total: rows.length };
}

export type ImportSummary = { created: number; skipped: number; failed: number };

export async function confirmLeadImport(rows: LeadPreviewRow[]): Promise<{ ok: true; summary: ImportSummary } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!rows.length) return { ok: false, error: "No rows selected." };
  if (rows.length > 300) return { ok: false, error: "Please import 300 rows or fewer at a time." };

  let created = 0;
  let skipped = 0;
  let failed = 0;

  const [existingLeads, sources, count] = await Promise.all([
    db.lead.findMany({ select: { phone: true } }),
    db.leadSource.findMany(),
    db.lead.count(),
  ]);
  const existingPhones = new Set(existingLeads.map((l) => normalizePhone(l.phone)));
  const sourceByName = new Map(sources.map((s) => [s.name.toLowerCase(), s.id]));
  const seen = new Set<string>();
  let codeCounter = count;

  for (const r of rows) {
    const phone = normalizePhone(r.phone);
    if (r.status === "invalid" || !r.fullName || phone.length !== 10) {
      failed++;
      continue;
    }
    if (existingPhones.has(phone) || seen.has(phone)) {
      skipped++;
      continue;
    }
    seen.add(phone);

    try {
      codeCounter++;
      const sourceId = r.sourceName ? sourceByName.get(r.sourceName.toLowerCase()) ?? null : null;
      const lead = await db.lead.create({
        data: {
          code: `NN-L${String(codeCounter).padStart(4, "0")}`,
          fullName: r.fullName,
          phone: r.phone,
          whatsapp: r.whatsapp || null,
          email: r.email || null,
          leadType: r.leadType,
          interest: r.interest,
          propertyType: r.propertyType || null,
          bhk: r.bhk ?? null,
          locations: r.locations || null,
          preferredProject: r.preferredProject || null,
          budgetMin: r.budgetMin ?? null,
          budgetMax: r.budgetMax ?? null,
          rentMin: r.rentMin ?? null,
          rentMax: r.rentMax ?? null,
          requirementNotes: r.notes || null,
          sourceId: sourceId,
          assignedToId: user.id,
          createdById: user.id,
          lastActivityAt: new Date(),
        },
      });
      await db.contact
        .upsert({
          where: { phone: r.phone },
          update: {},
          create: { name: r.fullName, phone: r.phone, whatsapp: r.whatsapp || null, email: r.email || null, createdById: user.id },
        })
        .catch(() => {});
      await logActivity({ type: "LEAD_CREATED", summary: "Lead imported from Excel", leadId: lead.id, userId: user.id });
      created++;
    } catch (e) {
      console.error("[import] lead row failed:", e);
      failed++;
    }
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true, summary: { created, skipped, failed } };
}
