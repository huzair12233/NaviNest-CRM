import { getSession } from "@/lib/auth";
import { getCallListEntriesForExport } from "@/features/call-list/queries";
import { buildWorkbookBuffer, xlsxResponse, type ExportColumn } from "@/lib/spreadsheet";

type Row = Awaited<ReturnType<typeof getCallListEntriesForExport>>[number];

const columns: ExportColumn<Row>[] = [
  { header: "Name", key: "name", value: (r) => r.name },
  { header: "Phone", key: "phone", value: (r) => r.phone },
  { header: "Status", key: "status", value: (r) => r.status },
  { header: "Comment / Outcome", key: "remark", value: (r) => r.remark },
  { header: "Called By", key: "calledBy", value: (r) => r.assignedTo?.name ?? "" },
  { header: "Called At", key: "calledAt", value: (r) => (r.calledAt ? r.calledAt.toISOString().slice(0, 16).replace("T", " ") : "") },
  { header: "Added By", key: "addedBy", value: (r) => r.createdBy?.name ?? "" },
  { header: "Added On", key: "createdAt", value: (r) => r.createdAt.toISOString().slice(0, 10) },
  { header: "Converted To Lead", key: "leadCode", value: (r) => r.lead?.code ?? "" },
];

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const rows = await getCallListEntriesForExport(user, sp);
  const buffer = await buildWorkbookBuffer("Call List", columns, rows);
  return xlsxResponse(buffer, `navinest-call-list-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
