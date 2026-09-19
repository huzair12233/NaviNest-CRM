import "server-only";
import { db } from "@/lib/db";
import { autoMapColumns, type SheetData } from "@/lib/spreadsheet";
import { PROPERTY_TYPES, PROPERTY_LISTING_TYPES, FURNISHINGS } from "@/lib/constants";

export const PROPERTY_FIELD_ALIASES: Record<string, string[]> = {
  title: ["title", "propertyname", "name"],
  listingType: ["listingtype", "salerent", "type", "saleorrent"],
  propertyType: ["propertytype", "typeofproperty"],
  bhk: ["bhk", "configuration", "config", "rooms"],
  location: ["location", "locality", "area"],
  address: ["address", "fulladdress"],
  city: ["city"],
  project: ["project", "society", "projectname"],
  carpetArea: ["carpetarea", "area", "sqft", "carpetareasqft"],
  builtupArea: ["builtuparea", "builtareasqft"],
  salePrice: ["price", "saleprice", "budget", "amount"],
  rent: ["rent", "monthlyrent"],
  deposit: ["deposit", "securitydeposit"],
  maintenance: ["maintenance", "maintenancecharges"],
  furnishing: ["furnishing", "furnishingstatus"],
  ownerName: ["ownername", "owner"],
  ownerPhone: ["ownerphone", "ownermobile", "ownercontact"],
  notes: ["notes", "remarks", "description"],
};

export type PropertyPreviewRow = {
  rowNumber: number;
  title: string;
  listingType: string;
  propertyType: string;
  bhk: number | null;
  location: string;
  address: string;
  city: string;
  project: string;
  carpetArea: number | null;
  builtupArea: number | null;
  salePrice: number | null;
  rent: number | null;
  deposit: number | null;
  maintenance: number | null;
  furnishing: string;
  ownerName: string;
  ownerPhone: string;
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
  if (!norm) return fallback;
  const match = list.find((v) => v.toLowerCase() === norm || norm.includes(v.toLowerCase()));
  return match ?? fallback;
}

export async function buildPropertyPreview(sheet: SheetData) {
  const mapping = autoMapColumns(sheet.headers, PROPERTY_FIELD_ALIASES);
  const existing = await db.property.findMany({ select: { title: true, location: true } });
  const existingKeys = new Set(existing.map((p) => `${p.title.toLowerCase()}|${p.location.toLowerCase()}`));
  const seenInFile = new Set<string>();

  const rows: PropertyPreviewRow[] = sheet.rows.map((raw, i) => {
    const get = (field: string) => (mapping[field] ? (raw[mapping[field] as string] ?? "").trim() : "");

    const title = get("title");
    const location = get("location");
    const key = `${title.toLowerCase()}|${location.toLowerCase()}`;

    let status: PropertyPreviewRow["status"] = "ready";
    let issue: string | undefined;

    if (!title || !location) {
      status = "invalid";
      issue = "Missing title or location";
    } else if (existingKeys.has(key) || seenInFile.has(key)) {
      status = "duplicate";
      issue = existingKeys.has(key) ? "Similar listing already in CRM" : "Duplicate within file";
    }
    if (title && location && status !== "invalid") seenInFile.add(key);

    return {
      rowNumber: i + 2,
      title,
      listingType: pick(PROPERTY_LISTING_TYPES, get("listingType"), "SALE"),
      propertyType: pick(PROPERTY_TYPES, get("propertyType"), "Apartment"),
      bhk: num(get("bhk")),
      location,
      address: get("address"),
      city: get("city") || "Navi Mumbai",
      project: get("project"),
      carpetArea: num(get("carpetArea")),
      builtupArea: num(get("builtupArea")),
      salePrice: num(get("salePrice")),
      rent: num(get("rent")),
      deposit: num(get("deposit")),
      maintenance: num(get("maintenance")),
      furnishing: pick(FURNISHINGS, get("furnishing"), "Unfurnished"),
      ownerName: get("ownerName"),
      ownerPhone: get("ownerPhone"),
      notes: get("notes"),
      status,
      issue,
    };
  });

  const mappedFields = Object.entries(mapping)
    .filter(([, header]) => header)
    .map(([field]) => field);

  return { mapping, mappedFields, rows };
}
