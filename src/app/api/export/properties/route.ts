import { getSession } from "@/lib/auth";
import { getPropertiesForExport } from "@/features/properties/queries";
import { buildWorkbookBuffer, xlsxResponse, type ExportColumn } from "@/lib/spreadsheet";
import { toArray } from "@/lib/utils";
import { PROPERTY_LISTING_LABELS } from "@/lib/constants";

type Row = Awaited<ReturnType<typeof getPropertiesForExport>>[number];

const columns: ExportColumn<Row>[] = [
  { header: "Property ID", key: "code", value: (r) => r.code },
  { header: "Title", key: "title", value: (r) => r.title },
  { header: "Listing Type", key: "listingType", value: (r) => PROPERTY_LISTING_LABELS[r.listingType] ?? r.listingType },
  { header: "Segment", key: "segment", value: (r) => r.segment },
  { header: "Property Type", key: "propertyType", value: (r) => r.propertyType },
  { header: "BHK", key: "bhk", value: (r) => r.bhk },
  { header: "Project / Society", key: "project", value: (r) => r.project?.name ?? "" },
  { header: "Location", key: "location", value: (r) => r.location },
  { header: "Address", key: "address", value: (r) => r.address },
  { header: "City", key: "city", value: (r) => r.city },
  { header: "Carpet Area", key: "carpetArea", value: (r) => r.carpetArea },
  { header: "Built-up Area", key: "builtupArea", value: (r) => r.builtupArea },
  { header: "Floor", key: "floor", value: (r) => r.floor },
  { header: "Total Floors", key: "totalFloors", value: (r) => r.totalFloors },
  { header: "Furnishing", key: "furnishing", value: (r) => r.furnishing },
  { header: "Parking", key: "parking", value: (r) => r.parking },
  { header: "Bathrooms", key: "bathrooms", value: (r) => r.bathrooms },
  { header: "Balcony", key: "balcony", value: (r) => r.balcony },
  { header: "Age (yrs)", key: "ageYears", value: (r) => r.ageYears },
  { header: "Possession", key: "possession", value: (r) => r.possession },
  { header: "Sale Price", key: "salePrice", value: (r) => r.salePrice },
  { header: "Rent", key: "rent", value: (r) => r.rent },
  { header: "Deposit", key: "deposit", value: (r) => r.deposit },
  { header: "Maintenance", key: "maintenance", value: (r) => r.maintenance },
  { header: "Amenities", key: "amenities", value: (r) => toArray(r.amenities).join(", ") },
  { header: "Owner", key: "owner", value: (r) => r.owner?.name ?? "" },
  { header: "Status", key: "status", value: (r) => r.status },
  { header: "Listing Source", key: "listingSource", value: (r) => r.listingSource },
  { header: "Added By", key: "addedBy", value: (r) => r.addedBy?.name ?? "" },
  { header: "Created", key: "createdAt", value: (r) => r.createdAt.toISOString().slice(0, 10) },
];

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const rows = await getPropertiesForExport(sp);
  const buffer = await buildWorkbookBuffer("Properties", columns, rows);
  return xlsxResponse(buffer, `navinest-properties-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
