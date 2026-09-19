import "server-only";
import ExcelJS from "exceljs";

// ── Export ───────────────────────────────────────────────────────────────────

export type ExportColumn<T> = { header: string; key: string; value: (row: T) => string | number | null };

export async function buildWorkbookBuffer<T>(sheetName: string, columns: ExportColumn<T>[], rows: T[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "NaviNest CRM";
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName.slice(0, 31));
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: Math.min(32, Math.max(12, c.header.length + 4)) }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6F5" } };
  for (const row of rows) {
    ws.addRow(Object.fromEntries(columns.map((c) => [c.key, c.value(row) ?? ""])));
  }
  ws.views = [{ state: "frozen", ySplit: 1 }];
  return wb.xlsx.writeBuffer() as Promise<ExcelJS.Buffer>;
}

export function xlsxResponse(buffer: ExcelJS.Buffer, filename: string) {
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// ── Import ───────────────────────────────────────────────────────────────────

export type SheetData = { headers: string[]; rows: Record<string, string>[] };

/** Reads the first sheet of an uploaded .xlsx/.xls file, or a .csv file, into header+row form. */
export async function readSheet(buffer: Buffer, filename: string): Promise<SheetData> {
  const isCsv = /\.csv$/i.test(filename);
  if (isCsv) return parseCsv(buffer.toString("utf-8"));

  const wb = new ExcelJS.Workbook();
  // exceljs's bundled types declare a stricter global `Buffer` than @types/node
  // ships today; the runtime call is fine, this is a types-only mismatch.
  await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
  const ws = wb.worksheets[0];
  if (!ws) return { headers: [], rows: [] };

  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, string>[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((h, i) => {
      if (!h) return;
      const cell = row.getCell(i + 1);
      const v = cellText(cell.value);
      obj[h] = v;
      if (v) hasValue = true;
    });
    if (hasValue) rows.push(obj);
  });

  return { headers: headers.filter(Boolean), rows };
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("text" in value) return String((value as { text: unknown }).text ?? "");
    if ("result" in value) return String((value as { result: unknown }).result ?? "");
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return "";
  }
  return String(value).trim();
}

function parseCsv(text: string): SheetData {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
    return obj;
  });
  return { headers, rows };
}

// ── Column auto-mapping ──────────────────────────────────────────────────────

/** Normalise a header for fuzzy matching: lowercase, strip everything but letters/digits. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Given the sheet's headers and a map of {fieldKey: [alias, alias, ...]},
 * returns {fieldKey: matchedHeader | null} using exact-normalised match first,
 * then a "header contains alias" fallback.
 */
export function autoMapColumns(headers: string[], aliases: Record<string, string[]>): Record<string, string | null> {
  const normHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }));
  const used = new Set<string>();
  const mapping: Record<string, string | null> = {};

  for (const [field, list] of Object.entries(aliases)) {
    const normAliases = list.map(normalize);
    let match = normHeaders.find((h) => !used.has(h.raw) && normAliases.includes(h.norm));
    if (!match) {
      match = normHeaders.find((h) => !used.has(h.raw) && normAliases.some((a) => h.norm.includes(a) || a.includes(h.norm)));
    }
    mapping[field] = match ? match.raw : null;
    if (match) used.add(match.raw);
  }
  return mapping;
}
