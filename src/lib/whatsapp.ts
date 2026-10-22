import { normalizePhone, listingPrice, toArray } from "./utils";

/** wa.me link. Omit phone for a generic share that opens WhatsApp's own contact picker. */
export function waLink(phone: string | null | undefined, text?: string): string {
  const base = phone ? `https://wa.me/91${normalizePhone(phone)}` : "https://wa.me/";
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

type ShareableProperty = {
  code: string;
  title: string;
  bhk: number | null;
  propertyType: string;
  listingType: string;
  salePrice: number | null;
  rent: number | null;
  deposit: number | null;
  location: string;
  city: string;
  carpetArea: number | null;
  furnishing: string;
  floor: number | null;
  totalFloors: number | null;
  amenities: unknown;
  description: string | null;
};

/**
 * Deliberately uses only `location` (locality/project) and never `address`
 * (which carries the flat/unit number) — keeps exact unit details private
 * until a client is serious, matching how agents actually share listings.
 */
export function buildPropertyShareMessage(p: ShareableProperty): string {
  const lines: string[] = [];
  const headline = `${p.bhk ? `${p.bhk} BHK ` : ""}${p.propertyType} — ${p.location}`;
  lines.push(`🏠 *${headline}*`);
  lines.push("");
  lines.push(`💰 ${listingPrice(p)}`);
  if (p.carpetArea) lines.push(`📐 ${p.carpetArea} sqft carpet${p.furnishing ? ` · ${p.furnishing}` : ""}`);
  if (p.floor != null) lines.push(`🏢 Floor ${p.floor}${p.totalFloors ? ` of ${p.totalFloors}` : ""}`);
  lines.push(`📍 ${p.location}, ${p.city}`);
  const amenities = toArray(p.amenities);
  if (amenities.length) lines.push(`✨ ${amenities.slice(0, 6).join(", ")}`);
  if (p.description) {
    lines.push("");
    lines.push(p.description);
  }
  lines.push("");
  lines.push("📸 Photos shared separately");
  lines.push(`— NaviNest Realtors · ${p.code}`);
  return lines.join("\n");
}
