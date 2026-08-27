"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  MessageCircle,
  StickyNote,
  CalendarPlus,
  MapPin,
  ArrowRightLeft,
  UserCog,
  Flame,
  Pencil,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, TextAreaField, SelectField, FormGrid } from "@/components/form/fields";
import { useToast } from "@/components/ui/toast";
import { normalizePhone } from "@/lib/utils";
import {
  FOLLOWUP_TYPES,
  PRIORITIES,
  LEAD_STATUSES,
  SITE_VISIT_STATUSES,
  TEMPERATURES,
} from "@/lib/constants";
import { addLeadNote, changeLeadStatus, assignLead, setTemperature } from "./actions";
import { createFollowUp } from "@/features/followups/actions";
import { scheduleSiteVisit } from "@/features/sitevisits/actions";

type Team = { id: string; name: string }[];
type Props = {
  lead: {
    id: string;
    fullName: string;
    phone: string;
    whatsapp: string | null;
    status: string;
    temperature: string;
    assignedToId: string | null;
  };
  team: Team;
  properties: { id: string; label: string }[];
  canAssign: boolean;
};

type DrawerKey = "note" | "followup" | "visit" | "status" | "assign" | null;

export function LeadQuickActions({ lead, team, properties, canAssign }: Props) {
  const [open, setOpen] = React.useState<DrawerKey>(null);
  const [tempOpen, setTempOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const toast = useToast();
  const router = useRouter();
  const close = () => setOpen(null);

  const wa = normalizePhone(lead.whatsapp || lead.phone);

  const changeTemp = (t: string) => {
    setTempOpen(false);
    start(async () => {
      const r = await setTemperature(lead.id, t);
      toast(r.ok ? "success" : "error", r.message ?? "Done");
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <a href={`tel:${lead.phone}`}>
          <Button size="sm" variant="outline">
            <Phone className="h-4 w-4" /> Call
          </Button>
        </a>
        <a href={`https://wa.me/91${wa}`} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
        </a>
        <Button size="sm" variant="outline" onClick={() => setOpen("note")}>
          <StickyNote className="h-4 w-4" /> Log
        </Button>
        <Button size="sm" onClick={() => setOpen("followup")}>
          <CalendarPlus className="h-4 w-4" /> Follow-up
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen("visit")}>
          <MapPin className="h-4 w-4" /> Site visit
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen("status")}>
          <ArrowRightLeft className="h-4 w-4" /> Status
        </Button>
        {canAssign && (
          <Button size="sm" variant="outline" onClick={() => setOpen("assign")}>
            <UserCog className="h-4 w-4" /> Assign
          </Button>
        )}
        <div className="relative">
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setTempOpen((o) => !o)}>
            <Flame className="h-4 w-4" /> {lead.temperature}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          {tempOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTempOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-ink-200 bg-white p-1 shadow-pop">
                {TEMPERATURES.map((t) => (
                  <button
                    key={t}
                    onClick={() => changeTemp(t)}
                    className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-ink-100"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <Link href={`/leads/${lead.id}/edit`}>
          <Button size="sm" variant="ghost">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </Link>
      </div>

      {/* Log interaction */}
      <Drawer open={open === "note"} onClose={close} title="Log interaction" description={lead.fullName}>
        <ActionForm action={addLeadNote} onSuccess={close} successToast="Added to timeline">
          <input type="hidden" name="leadId" value={lead.id} />
          <SelectField name="type" label="Type" options={[
            { value: "NOTE", label: "Note" },
            { value: "CALL", label: "Call" },
            { value: "WHATSAPP", label: "WhatsApp" },
            { value: "EMAIL", label: "Email" },
          ]} defaultValue="CALL" required />
          <TextAreaField name="summary" label="What happened?" className="mt-4" placeholder="Spoke with the client about…" />
          <div className="mt-5">
            <SubmitButton>Add</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>

      {/* Follow-up */}
      <Drawer open={open === "followup"} onClose={close} title="Schedule follow-up" description={lead.fullName}>
        <ActionForm action={createFollowUp} onSuccess={close} successToast="Follow-up scheduled">
          <input type="hidden" name="leadId" value={lead.id} />
          <FormGrid>
            <TextField name="dueAt" label="Due date & time" type="datetime-local" required />
            <SelectField name="type" label="Type" options={FOLLOWUP_TYPES} defaultValue="Call" required />
            <SelectField name="priority" label="Priority" options={PRIORITIES} defaultValue="Normal" />
            <SelectField
              name="assignedToId"
              label="Assign to"
              options={team.map((t) => ({ value: t.id, label: t.name }))}
              placeholder="Lead owner"
            />
          </FormGrid>
          <TextField name="purpose" label="Purpose" className="mt-4" placeholder="Discuss shortlisted options" />
          <TextAreaField name="notes" label="Notes" className="mt-4" />
          <div className="mt-5">
            <SubmitButton>Schedule</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>

      {/* Site visit */}
      <Drawer open={open === "visit"} onClose={close} title="Schedule site visit" description={lead.fullName}>
        <ActionForm action={scheduleSiteVisit} onSuccess={close} successToast="Site visit scheduled">
          <input type="hidden" name="leadId" value={lead.id} />
          <FormGrid>
            <TextField name="scheduledAt" label="Date & time" type="datetime-local" required />
            <SelectField name="status" label="Status" options={SITE_VISIT_STATUSES.slice(0, 2)} defaultValue="Scheduled" />
          </FormGrid>
          <SelectField
            name="propertyId"
            label="Property"
            className="mt-4"
            options={properties.map((p) => ({ value: p.id, label: p.label }))}
            placeholder="Select property (optional)"
          />
          <TextField name="location" label="Meeting point / location" className="mt-4" />
          <SelectField
            name="assignedToId"
            label="Agent"
            className="mt-4"
            options={team.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Lead owner"
          />
          <div className="mt-5">
            <SubmitButton>Schedule</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>

      {/* Status */}
      <Drawer open={open === "status"} onClose={close} title="Change status" description={`Current: ${lead.status}`}>
        <ActionForm action={changeLeadStatus.bind(null, lead.id)} onSuccess={close}>
          <SelectField name="status" label="New status" options={LEAD_STATUSES} defaultValue={lead.status} required />
          <TextField name="lostReason" label="Reason (if lost / not interested)" className="mt-4" />
          <TextAreaField name="note" label="Note" className="mt-4" />
          <div className="mt-5">
            <SubmitButton>Update status</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>

      {/* Assign */}
      {canAssign && (
        <Drawer open={open === "assign"} onClose={close} title="Assign lead" description={lead.fullName}>
          <ActionForm action={assignLead.bind(null, lead.id)} onSuccess={close}>
            <SelectField
              name="assignedToId"
              label="Team member"
              options={team.map((t) => ({ value: t.id, label: t.name }))}
              defaultValue={lead.assignedToId ?? ""}
              required
            />
            <div className="mt-5">
              <SubmitButton>Assign</SubmitButton>
            </div>
          </ActionForm>
        </Drawer>
      )}
    </>
  );
}
