import { getSession } from "@/lib/auth";
import { getLeadsForExport } from "@/features/leads/queries";
import { buildWorkbookBuffer, xlsxResponse, type ExportColumn } from "@/lib/spreadsheet";
import { toArray } from "@/lib/utils";
import { INTEREST_LABELS } from "@/lib/constants";

type Row = Awaited<ReturnType<typeof getLeadsForExport>>[number];

const columns: ExportColumn<Row>[] = [
  { header: "Lead ID", key: "code", value: (r) => r.code },
  { header: "Full Name", key: "fullName", value: (r) => r.fullName },
  { header: "Phone", key: "phone", value: (r) => r.phone },
  { header: "WhatsApp", key: "whatsapp", value: (r) => r.whatsapp },
  { header: "Email", key: "email", value: (r) => r.email },
  { header: "Lead Type", key: "leadType", value: (r) => r.leadType },
  { header: "Interest", key: "interest", value: (r) => INTEREST_LABELS[r.interest] ?? r.interest },
  { header: "Status", key: "status", value: (r) => r.status },
  { header: "Temperature", key: "temperature", value: (r) => r.temperature },
  { header: "Priority", key: "priority", value: (r) => r.priority },
  { header: "Property Type", key: "propertyType", value: (r) => r.propertyType },
  { header: "BHK", key: "bhk", value: (r) => r.bhk },
  { header: "Locations", key: "locations", value: (r) => toArray(r.locations).join(", ") },
  { header: "Preferred Project", key: "preferredProject", value: (r) => r.preferredProject },
  { header: "Budget Min", key: "budgetMin", value: (r) => r.budgetMin },
  { header: "Budget Max", key: "budgetMax", value: (r) => r.budgetMax },
  { header: "Rent Min", key: "rentMin", value: (r) => r.rentMin },
  { header: "Rent Max", key: "rentMax", value: (r) => r.rentMax },
  { header: "Max Deposit", key: "depositMax", value: (r) => r.depositMax },
  { header: "Area Min (sqft)", key: "areaMin", value: (r) => r.areaMin },
  { header: "Area Max (sqft)", key: "areaMax", value: (r) => r.areaMax },
  { header: "Furnishing", key: "furnishing", value: (r) => r.furnishing },
  { header: "Source", key: "source", value: (r) => r.source?.name ?? "" },
  { header: "Assigned To", key: "assignedTo", value: (r) => r.assignedTo?.name ?? "" },
  { header: "Notes", key: "requirementNotes", value: (r) => r.requirementNotes },
  { header: "Created", key: "createdAt", value: (r) => r.createdAt.toISOString().slice(0, 10) },
];

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const rows = await getLeadsForExport(user, sp);
  const buffer = await buildWorkbookBuffer("Leads", columns, rows);
  return xlsxResponse(buffer, `navinest-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
