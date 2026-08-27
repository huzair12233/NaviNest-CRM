"use client";

import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, TextAreaField, SelectField, FormGrid } from "@/components/form/fields";
import { ButtonLink } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-result";
import { PIPELINE_STAGES } from "@/lib/constants";

type Opt = { value: string; label: string };

export function DealForm({
  action,
  mode,
  leads,
  properties,
  owners,
  team,
  canAssign,
  deal,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  mode: "create" | "edit";
  leads: Opt[];
  properties: Opt[];
  owners: Opt[];
  team: Opt[];
  canAssign: boolean;
  deal?: Record<string, unknown> & { id: string };
}) {
  const d: Record<string, unknown> = deal ?? {};
  const g = (k: string) => (d[k] as string | number | null | undefined) ?? undefined;

  return (
    <ActionForm
      action={action}
      successToast={mode === "create" ? "Deal created" : "Deal updated"}
      redirectOnSuccess={(s) => `/deals/${(s.data?.id as string) ?? deal?.id ?? ""}`}
      className="max-w-2xl"
    >
      <div className="card space-y-4 p-6">
        <TextField name="title" label="Deal title" required defaultValue={g("title") as string} placeholder="Rahul Verma · 2 BHK Bhagwati Greens" />
        <FormGrid cols={3}>
          <SelectField name="type" label="Type" options={[{ value: "SALE", label: "Sale" }, { value: "RENT", label: "Rental" }]} defaultValue={(g("type") as string) ?? "SALE"} required />
          <TextField name="value" label="Deal value (₹)" type="number" defaultValue={g("value")} />
          {mode === "create" && (
            <SelectField name="stage" label="Stage" options={PIPELINE_STAGES.map((s) => ({ value: s.key, label: s.label }))} defaultValue="Qualified" />
          )}
          <TextField name="probability" label="Probability (%)" type="number" defaultValue={g("probability")} />
          <TextField name="expectedCloseDate" label="Expected close" type="date" defaultValue={(g("expectedCloseDate") as string)?.slice?.(0, 10)} />
        </FormGrid>
        <FormGrid>
          <SelectField name="leadId" label="Lead" options={leads} defaultValue={(g("leadId") as string) ?? ""} placeholder="Link a lead" />
          <SelectField name="propertyId" label="Property" options={properties} defaultValue={(g("propertyId") as string) ?? ""} placeholder="Link a property" />
          <SelectField name="ownerId" label="Owner" options={owners} defaultValue={(g("ownerId") as string) ?? ""} placeholder="Link an owner" />
          {canAssign && (
            <SelectField name="assignedToId" label="Assigned to" options={team} defaultValue={(g("assignedToId") as string) ?? ""} placeholder="Me" />
          )}
        </FormGrid>
        <TextAreaField name="notes" label="Notes" defaultValue={g("notes") as string} />
        <div className="flex gap-2">
          <SubmitButton>{mode === "create" ? "Create deal" : "Save"}</SubmitButton>
          <ButtonLink variant="ghost" href={deal ? `/deals/${deal.id}` : "/pipeline"}>Cancel</ButtonLink>
        </div>
      </div>
    </ActionForm>
  );
}
