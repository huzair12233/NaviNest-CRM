import "server-only";
import { db } from "@/lib/db";
import { autoMapColumns, type SheetData } from "@/lib/spreadsheet";
import { isValidPhone, normalizePhone } from "@/lib/utils";
import { LEAD_TYPES, INTERESTS } from "@/lib/constants";

export const LEAD_FIELD_ALIASES: Record<string, string[]> = {
  fullName: ["name", "fullname", "leadname", "clientname", "customername", "fullnameoflead"],
  phone: ["phone", "mobile", "contact", "contactnumber", "mobilenumber", "phonenumber", "cell"],
  whatsapp: ["whatsapp", "whatsappnumber", "watsapp"],
  email: ["email", "emailid", "email address", "mailid"],
  leadType: ["leadtype", "type", "category", "clienttype"],
  interest: ["interest", "salerent", "requirementtype", "saleorrent"],
  propertyType: ["propertytype", "typeofproperty"],
  bhk: ["bhk", "configuration", "config", "rooms"],
  locations: ["location", "locations", "preferredlocation", "area", "preferredarea"],
  preferredProject: ["project", "society", "preferredproject", "preferredsociety"],
  budgetMin: ["budgetmin", "minbudget", "budgetfrom"],
  budgetMax: ["budgetmax", "maxbudget", "budgetto", "budget"],
  rentMin: ["rentmin", "minrent"],
  rentMax: ["rentmax", "maxrent", "rent"],
  source: ["source", "leadsource"],
  notes: ["notes", "remarks", "requirementnotes", "comments", "comment"],
};

export type LeadPreviewRow = {
  rowNumber: number;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  leadType: string;
  interest: string;
  propertyType: string;
  bhk: number | null;
  locations: string;
  preferredProject: string;
  budgetMin: number | null;
  budgetMax: number | null;
  rentMin: number | null;
  rentMax: number | null;
  sourceName: string;
  notes: string;
  status: "ready" | "duplicate" | "invalid";
  issue?: string;
};

function num(v: string): number | null {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function pick(list: readonly string[], raw: string, fallback: string): string {
  const norm = raw.trim().toLowerCase();
  const match = list.find((v) => v.toLowerCase() === norm || v.toLowerCase().startsWith(norm.slice(0, 3)));
  return match ?? fallback;
}

export async function buildLeadPreview(sheet: SheetData) {
  const mapping = autoMapColumns(sheet.headers, LEAD_FIELD_ALIASES);
  const existing = await db.lead.findMany({ select: { phone: true } });
  const existingPhones = new Set(existing.map((l) => normalizePhone(l.phone)));
  const seenInFile = new Set<string>();

  const rows: LeadPreviewRow[] = sheet.rows.map((raw, i) => {
    const get = (field: string) => (mapping[field] ? (raw[mapping[field] as string] ?? "").trim() : "");

    const fullName = get("fullName");
    const phoneRaw = get("phone");
    const phone = normalizePhone(phoneRaw);

    let status: LeadPreviewRow["status"] = "ready";
    let issue: string | undefined;

    if (!fullName) {
      status = "invalid";
      issue = "Missing name";
    } else if (!isValidPhone(phoneRaw)) {
      status = "invalid";
      issue = "Invalid or missing phone";
    } else if (existingPhones.has(phone) || seenInFile.has(phone)) {
      status = "duplicate";
      issue = existingPhones.has(phone) ? "Phone already in CRM" : "Duplicate within file";
    }
    if (phone && status !== "invalid") seenInFile.add(phone);

    return {
      rowNumber: i + 2,
      fullName,
      phone: phoneRaw,
      whatsapp: get("whatsapp"),
      email: get("email"),
      leadType: pick(LEAD_TYPES, get("leadType"), "Buyer"),
      interest: pick(INTERESTS, get("interest"), "SALE"),
      propertyType: get("propertyType"),
      bhk: num(get("bhk")),
      locations: get("locations"),
      preferredProject: get("preferredProject"),
      budgetMin: num(get("budgetMin")),
      budgetMax: num(get("budgetMax")),
      rentMin: num(get("rentMin")),
      rentMax: num(get("rentMax")),
      sourceName: get("source"),
      notes: get("notes"),
      status,
      issue,
    };
  });

  return { mapping, rows };
}
