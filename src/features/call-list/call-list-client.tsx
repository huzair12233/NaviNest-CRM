"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, MessageCircle, Check, ChevronDown, X, Trash2, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Drawer } from "@/components/ui/drawer";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, SelectField, FormGrid } from "@/components/form/fields";
import { useToast } from "@/components/ui/toast";
import { waLink } from "@/lib/whatsapp";
import { LEAD_TYPES, INTERESTS, INTEREST_LABELS } from "@/lib/constants";
import {
  parseAndSaveCallList,
  updateCallListEntry,
  setCallListStatus,
  deleteCallListEntry,
  saveCallListEntryAsLead,
} from "./actions";

const CALL_OUTCOMES = ["Interested", "Not Interested", "Ringing", "Call Cut", "Busy", "Switch Off", "No Answer", "Call Back"];

type Entry = {
  id: string;
  name: string | null;
  phone: string;
  remark: string | null;
  status: string;
  assignedTo: { name: string; avatarColor: string } | null;
  existingLead: { id: string; code: string } | null;
};

export function CallListClient({ rows }: { rows: Entry[] }) {
  return (
    <div className="space-y-5">
      <PasteBox />
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 bg-white/50 px-6 py-10 text-center text-sm text-ink-400">
          Nothing here. Paste a list above to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <Row key={r.id} entry={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PasteBox() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  return (
    <div className="card p-4">
      {!open ? (
        <Button size="sm" onClick={() => setOpen(true)}>
          Paste List
        </Button>
      ) : (
        <ActionForm
          action={parseAndSaveCallList}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        >
          <label className="label-base">Paste name and numbers list here</label>
          <textarea
            name="text"
            required
            rows={8}
            placeholder={"Ramesh, 9876543210\n+91 86959 68959\n…"}
            className="input-base min-h-[180px] resize-y font-mono text-xs"
          />
          <div className="mt-3 flex gap-2">
            <SubmitButton>Parse Numbers</SubmitButton>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </ActionForm>
      )}
    </div>
  );
}

function Row({ entry }: { entry: Entry }) {
  const [editing, setEditing] = React.useState(false);
  const [leadDrawer, setLeadDrawer] = React.useState(false);
  const [pending, start] = React.useTransition();
  const router = useRouter();
  const toast = useToast();

  const act = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.message) toast(r.ok ? "success" : "error", r.message);
      router.refresh();
    });

  const done = entry.status !== "Pending";

  return (
    <li className={`card p-3.5 ${done ? "opacity-70" : ""}`}>
      {editing ? (
        <EditForm entry={entry} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <button onClick={() => setEditing(true)} className="text-left">
              <span className="font-medium text-ink-900 hover:text-brand-700">{entry.name || "Unknown"}</span>
              <span className="ml-2 text-sm text-ink-500">{entry.phone}</span>
            </button>
            {entry.remark && <p className="mt-0.5 truncate text-xs text-ink-400">{entry.remark}</p>}
            {entry.existingLead && (
              <Link href={`/leads/${entry.existingLead.id}`} className="mt-1 inline-block">
                <Badge tone="brand">Already a lead · {entry.existingLead.code}</Badge>
              </Link>
            )}
          </div>

          <Badge tone={entry.status === "Converted" ? "emerald" : entry.status === "Skipped" ? "slate" : entry.status === "Called" ? "blue" : "amber"}>
            {entry.status}
          </Badge>

          {entry.assignedTo && <Avatar name={entry.assignedTo.name} color={entry.assignedTo.avatarColor} size={22} />}

          <div className="flex items-center gap-1.5">
            <a href={`tel:${entry.phone}`}>
              <Button size="sm" variant="outline">
                <Phone className="h-3.5 w-3.5" />
              </Button>
            </a>
            <a href={waLink(entry.phone)} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
            </a>
            {entry.status === "Pending" && <CallOutcomeMenu entry={entry} pending={pending} act={act} />}
            {entry.status === "Pending" && (
              <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => setCallListStatus(entry.id, "Skipped"))} title="Skip">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            {!entry.existingLead && (
              <Button size="sm" variant="outline" onClick={() => setLeadDrawer(true)} title="Save as lead">
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => act(() => deleteCallListEntry(entry.id))} title="Remove">
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        </div>
      )}

      <Drawer open={leadDrawer} onClose={() => setLeadDrawer(false)} title="Save as lead" description={entry.phone}>
        <ActionForm
          action={saveCallListEntryAsLead.bind(null, entry.id)}
          onSuccess={(s) => {
            setLeadDrawer(false);
            if (s.data?.id) router.push(`/leads/${s.data.id}`);
          }}
          successToast="Lead created"
        >
          <FormGrid cols={1}>
            <TextField name="fullName" label="Full name" required defaultValue={entry.name ?? ""} />
            <TextField name="phone" label="Phone" required defaultValue={entry.phone} />
            <SelectField name="leadType" label="Lead type" options={LEAD_TYPES} defaultValue="Buyer" />
            <SelectField
              name="interest"
              label="Interest"
              options={INTERESTS.map((i) => ({ value: i, label: INTEREST_LABELS[i] }))}
              defaultValue="SALE"
            />
          </FormGrid>
          {entry.remark && <p className="mt-3 rounded-lg bg-ink-50 p-2 text-xs text-ink-500">Note carried over: “{entry.remark}”</p>}
          <div className="mt-5">
            <SubmitButton>Create lead</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>
    </li>
  );
}

function CallOutcomeMenu({
  entry,
  pending,
  act,
}: {
  entry: Entry;
  pending: boolean;
  act: (fn: () => Promise<{ ok: boolean; message?: string }>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState("");

  const choose = (remark: string) => {
    setOpen(false);
    setCustom("");
    act(() => setCallListStatus(entry.id, "Called", remark));
  };

  return (
    <div className="relative">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen((o) => !o)} title="Mark called">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-ink-200 bg-white p-2.5 shadow-pop">
            <p className="mb-1.5 px-0.5 text-xs font-medium text-ink-400">Call outcome</p>
            <div className="flex flex-wrap gap-1.5">
              {CALL_OUTCOMES.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => choose(o)}
                  className="rounded-full border border-ink-200 px-2.5 py-1 text-xs text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {o}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (custom.trim()) choose(custom.trim());
              }}
              className="mt-2 flex gap-1.5"
            >
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Other comment…"
                className="input-base h-8 flex-1 text-xs"
              />
              <Button size="sm" type="submit" disabled={!custom.trim()}>
                Add
              </Button>
            </form>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                act(() => setCallListStatus(entry.id, "Called"));
              }}
              className="mt-2 w-full text-left text-xs text-ink-400 hover:text-ink-600"
            >
              Skip comment — just mark called
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EditForm({ entry, onDone }: { entry: Entry; onDone: () => void }) {
  return (
    <ActionForm action={updateCallListEntry.bind(null, entry.id)} onSuccess={onDone} successToast="Saved">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <TextField name="name" label="Name" defaultValue={entry.name ?? ""} />
        <TextField name="phone" label="Phone" required defaultValue={entry.phone} />
        <TextField name="remark" label="Remark" defaultValue={entry.remark ?? ""} />
      </div>
      <div className="mt-3 flex gap-2">
        <SubmitButton>Save</SubmitButton>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </ActionForm>
  );
}
