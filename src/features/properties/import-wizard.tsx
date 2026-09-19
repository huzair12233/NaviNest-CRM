"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { parsePropertyImportFile, confirmPropertyImport, type ImportSummary } from "./import-actions";
import type { PropertyPreviewRow } from "./import";

const FIELD_LABELS: Record<string, string> = {
  title: "Title", listingType: "Listing type", propertyType: "Property type", bhk: "BHK",
  location: "Location", address: "Address", city: "City", project: "Project", carpetArea: "Carpet area",
  builtupArea: "Built-up area", salePrice: "Sale price", rent: "Rent", deposit: "Deposit",
  maintenance: "Maintenance", furnishing: "Furnishing", ownerName: "Owner name", ownerPhone: "Owner phone", notes: "Notes",
};

export function PropertyImportWizard() {
  const [stage, setStage] = React.useState<"upload" | "preview" | "done">("upload");
  const [busy, setBusy] = React.useState(false);
  const [rows, setRows] = React.useState<PropertyPreviewRow[]>([]);
  const [mappedFields, setMappedFields] = React.useState<string[]>([]);
  const [checked, setChecked] = React.useState<Record<number, boolean>>({});
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();

  const onFile = async (file: File) => {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await parsePropertyImportFile(null, fd);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRows(res.rows);
    setMappedFields(res.mappedFields);
    setChecked(Object.fromEntries(res.rows.map((r) => [r.rowNumber, r.status === "ready"])));
    setStage("preview");
  };

  const confirm = async () => {
    const selected = rows.filter((r) => checked[r.rowNumber]);
    if (!selected.length) {
      toast("error", "Select at least one row to import");
      return;
    }
    setBusy(true);
    const res = await confirmPropertyImport(selected);
    setBusy(false);
    if (!res.ok) {
      toast("error", res.error);
      return;
    }
    setSummary(res.summary);
    setStage("done");
    router.refresh();
  };

  const counts = {
    ready: rows.filter((r) => r.status === "ready").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
  };

  if (stage === "done" && summary) {
    return (
      <Card className="max-w-lg">
        <CardBody className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h2 className="mt-3 text-lg font-semibold text-ink-900">Import complete</h2>
          <p className="mt-4 flex justify-center gap-6 text-sm">
            <span className="text-emerald-700"><b>{summary.created}</b> created</span>
            <span className="text-amber-700"><b>{summary.skipped}</b> skipped (duplicate)</span>
            <span className="text-red-600"><b>{summary.failed}</b> failed</span>
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => router.push("/properties")}>Go to Properties</Button>
            <Button variant="outline" onClick={() => { setStage("upload"); setRows([]); setSummary(null); }}>
              Import another file
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (stage === "preview") {
    return (
      <div className="space-y-4">
        <Card>
          <CardBody>
            <p className="text-sm text-ink-600">
              Detected columns: {mappedFields.map((f) => FIELD_LABELS[f] ?? f).join(", ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="emerald">{counts.ready} ready</Badge>
              <Badge tone="amber">{counts.duplicate} duplicate</Badge>
              <Badge tone="red">{counts.invalid} invalid</Badge>
            </div>
          </CardBody>
        </Card>

        <Table>
          <THead>
            <tr>
              <TH></TH>
              <TH>Row</TH>
              <TH>Title</TH>
              <TH>Location</TH>
              <TH>Type</TH>
              <TH>Price</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.rowNumber}>
                <TD>
                  <input
                    type="checkbox"
                    disabled={r.status === "invalid"}
                    checked={!!checked[r.rowNumber]}
                    onChange={(e) => setChecked((c) => ({ ...c, [r.rowNumber]: e.target.checked }))}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600"
                  />
                </TD>
                <TD className="text-xs text-ink-400">{r.rowNumber}</TD>
                <TD className="max-w-[220px] truncate text-sm font-medium text-ink-800">{r.title || "—"}</TD>
                <TD className="text-sm">{r.location || "—"}</TD>
                <TD className="text-sm">{r.listingType}</TD>
                <TD className="text-sm">{r.salePrice || r.rent || r.deposit || "—"}</TD>
                <TD>
                  {r.status === "ready" && <Badge tone="emerald">Ready</Badge>}
                  {r.status === "duplicate" && <Badge tone="amber">{r.issue}</Badge>}
                  {r.status === "invalid" && (
                    <Badge tone="red">
                      <AlertTriangle className="h-3 w-3" /> {r.issue}
                    </Badge>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>

        <div className="flex gap-2">
          <Button onClick={confirm} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import {Object.values(checked).filter(Boolean).length} properties
          </Button>
          <Button variant="ghost" onClick={() => setStage("upload")}>
            Start over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardBody>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ink-300 py-12 text-center hover:border-brand-400 hover:bg-brand-50/40"
        >
          {busy ? <Loader2 className="h-8 w-8 animate-spin text-ink-400" /> : <Upload className="h-8 w-8 text-ink-400" />}
          <p className="text-sm font-medium text-ink-700">{busy ? "Reading file…" : "Click to choose a file"}</p>
          <p className="text-xs text-ink-400">.xlsx, .xls or .csv — up to 300 rows</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <div className="mt-4 rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
          <p className="mb-1 flex items-center gap-1 font-medium text-ink-600">
            <Copy className="h-3.5 w-3.5" /> Column names we recognise automatically
          </p>
          Title, Listing Type, Property Type, BHK, Location, Address, City, Project, Carpet
          Area, Sale Price, Rent, Deposit, Maintenance, Furnishing, Owner Name, Owner Phone —
          any reasonable variant of these headers works.
        </div>
      </CardBody>
    </Card>
  );
}
