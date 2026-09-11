"use client";

import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  FormGrid,
  FormSection,
} from "@/components/form/fields";
import { ButtonLink } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-result";
import {
  LEAD_TYPES,
  INTERESTS,
  INTEREST_LABELS,
  TEMPERATURES,
  PRIORITIES,
  PROPERTY_TYPES,
  BHK_OPTIONS,
  LEAD_STATUSES,
} from "@/lib/constants";

type Option = { id: string; name: string };

export function LeadForm({
  action,
  sources,
  partners,
  team,
  canAssign,
  lead,
  mode,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  sources: Option[];
  partners: Option[];
  team: Option[];
  canAssign: boolean;
  mode: "create" | "edit";
  lead?: {
    id: string;
    fullName: string;
    phone: string;
    altPhone: string | null;
    whatsapp: string | null;
    email: string | null;
    leadType: string;
    interest: string;
    status: string;
    temperature: string;
    priority: string;
    propertyType: string | null;
    bhk: number | null;
    locations: unknown;
    preferredProject: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    areaMin: number | null;
    areaMax: number | null;
    rentMin: number | null;
    rentMax: number | null;
    depositMax: number | null;
    furnishing: string | null;
    parkingReq: boolean;
    floorPref: string | null;
    possessionReq: string | null;
    loanRequired: boolean;
    occupancy: string | null;
    requirementNotes: string | null;
    sourceId: string | null;
    channelPartnerId: string | null;
    assignedToId: string | null;
  };
}) {
  const locations = Array.isArray(lead?.locations)
    ? (lead!.locations as string[]).join(", ")
    : (lead?.locations as string) ?? "";

  return (
    <ActionForm
      action={action}
      successToast={mode === "create" ? "Lead created" : "Lead updated"}
      redirectOnSuccess={(s) => `/leads/${(s.data?.id as string) ?? lead?.id ?? ""}`}
      className="max-w-3xl"
    >
      <div className="card p-6">
        <FormSection title="Contact">
          <FormGrid>
            <TextField name="fullName" label="Full name" required defaultValue={lead?.fullName} />
            <TextField name="phone" label="Mobile" required type="tel" defaultValue={lead?.phone} placeholder="10-digit number" />
            <TextField name="whatsapp" label="WhatsApp" type="tel" defaultValue={lead?.whatsapp} />
            <TextField name="altPhone" label="Alternate mobile" type="tel" defaultValue={lead?.altPhone} />
            <TextField name="email" label="Email" type="email" defaultValue={lead?.email} />
          </FormGrid>
        </FormSection>

        <FormSection title="Classification">
          <FormGrid cols={3}>
            <SelectField name="leadType" label="Lead type" options={LEAD_TYPES} defaultValue={lead?.leadType ?? "Buyer"} required />
            <SelectField
              name="interest"
              label="Interest"
              options={INTERESTS.map((i) => ({ value: i, label: INTEREST_LABELS[i] }))}
              defaultValue={lead?.interest ?? "SALE"}
              required
            />
            <SelectField name="temperature" label="Temperature" options={TEMPERATURES} defaultValue={lead?.temperature ?? "Warm"} required />
            <SelectField name="priority" label="Priority" options={PRIORITIES} defaultValue={lead?.priority ?? "Normal"} required />
            {mode === "edit" && (
              <SelectField name="status" label="Status" options={LEAD_STATUSES} defaultValue={lead?.status} />
            )}
            <SelectField
              name="sourceId"
              label="Source"
              options={sources.map((s) => ({ value: s.id, label: s.name }))}
              defaultValue={lead?.sourceId ?? ""}
              placeholder="Select source"
            />
            <SelectField
              name="channelPartnerId"
              label="Channel partner"
              options={partners.map((p) => ({ value: p.id, label: p.name }))}
              defaultValue={lead?.channelPartnerId ?? ""}
              placeholder="None"
            />
            {canAssign && (
              <SelectField
                name="assignedToId"
                label="Assign to"
                options={team.map((t) => ({ value: t.id, label: t.name }))}
                defaultValue={lead?.assignedToId ?? ""}
                placeholder="Me"
              />
            )}
          </FormGrid>
        </FormSection>

        <FormSection title="Requirement">
          <FormGrid cols={3}>
            <SelectField name="propertyType" label="Property type" options={PROPERTY_TYPES} defaultValue={lead?.propertyType ?? ""} placeholder="Any" />
            <SelectField name="bhk" label="BHK" options={BHK_OPTIONS.map((b) => ({ value: String(b), label: `${b} BHK` }))} defaultValue={lead?.bhk ? String(lead.bhk) : ""} placeholder="Any" />
            <SelectField name="occupancy" label="Occupancy" options={["Family", "Bachelor", "Company"]} defaultValue={lead?.occupancy ?? ""} placeholder="Any" />
          </FormGrid>
          <TextField
            name="locations"
            label="Preferred locations"
            hint="Comma-separated, e.g. Kharghar, Ulwe, Panvel"
            defaultValue={locations}
            className="mt-4"
          />
          <TextField name="preferredProject" label="Preferred project / society" defaultValue={lead?.preferredProject} className="mt-4" />

          <p className="mt-4 text-xs text-ink-400">
            Fill Budget for sale (or as the deposit range for Heavy Deposit), or Rent &amp; Max deposit for rental — whichever applies.
          </p>
          <FormGrid cols={3}>
            <TextField name="budgetMin" label="Budget min (₹)" type="number" defaultValue={lead?.budgetMin} className="mt-2" />
            <TextField name="budgetMax" label="Budget max (₹)" type="number" defaultValue={lead?.budgetMax} className="mt-2" />
            <div />
            <TextField name="rentMin" label="Rent min (₹/mo)" type="number" defaultValue={lead?.rentMin} className="mt-2" />
            <TextField name="rentMax" label="Rent max (₹/mo)" type="number" defaultValue={lead?.rentMax} className="mt-2" />
            <TextField name="depositMax" label="Max deposit (₹)" type="number" defaultValue={lead?.depositMax} className="mt-2" />
          </FormGrid>

          <FormGrid cols={3}>
            <TextField name="areaMin" label="Carpet area min (sqft)" type="number" defaultValue={lead?.areaMin} className="mt-4" />
            <TextField name="areaMax" label="Carpet area max (sqft)" type="number" defaultValue={lead?.areaMax} className="mt-4" />
            <SelectField name="furnishing" label="Furnishing" options={["Any", "Unfurnished", "Semi", "Furnished"]} defaultValue={lead?.furnishing ?? "Any"} className="mt-4" />
            <TextField name="floorPref" label="Floor preference" defaultValue={lead?.floorPref} className="mt-4" />
            <SelectField name="possessionReq" label="Possession" options={["Any", "Ready", "UnderConstruction"]} defaultValue={lead?.possessionReq ?? "Any"} className="mt-4" />
          </FormGrid>

          <div className="mt-3 flex flex-wrap gap-x-6">
            <CheckboxField name="parkingReq" label="Needs parking" defaultChecked={lead?.parkingReq} />
            <CheckboxField name="loanRequired" label="Home loan required" defaultChecked={lead?.loanRequired} />
          </div>

          <TextAreaField
            name="requirementNotes"
            label="Additional requirements / notes"
            defaultValue={lead?.requirementNotes}
            className="mt-4"
          />
        </FormSection>

        <div className="flex items-center gap-2">
          <SubmitButton>{mode === "create" ? "Create lead" : "Save changes"}</SubmitButton>
          <ButtonLink variant="ghost" href={lead ? `/leads/${lead.id}` : "/leads"}>
            Cancel
          </ButtonLink>
        </div>
      </div>
    </ActionForm>
  );
}
