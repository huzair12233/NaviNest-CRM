"use client";

import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, TextAreaField, SelectField, FormGrid } from "@/components/form/fields";
import { ButtonLink } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-result";

export function OwnerForm({
  action,
  mode,
  owner,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  mode: "create" | "edit";
  owner?: {
    id: string;
    name: string;
    phone: string;
    whatsapp: string | null;
    email: string | null;
    preferredContact: string;
    relationshipStatus: string;
    notes: string | null;
  };
}) {
  return (
    <ActionForm
      action={action}
      successToast={mode === "create" ? "Owner added" : "Owner updated"}
      redirectOnSuccess={(s) => `/owners/${(s.data?.id as string) ?? owner?.id ?? ""}`}
      className="max-w-xl"
    >
      <div className="card space-y-4 p-6">
        <TextField name="name" label="Owner name" required defaultValue={owner?.name} />
        <FormGrid>
          <TextField name="phone" label="Phone" type="tel" required defaultValue={owner?.phone} />
          <TextField name="whatsapp" label="WhatsApp" type="tel" defaultValue={owner?.whatsapp} />
          <TextField name="email" label="Email" type="email" defaultValue={owner?.email} />
          <SelectField name="preferredContact" label="Preferred contact" options={["Call", "WhatsApp", "Email"]} defaultValue={owner?.preferredContact ?? "Call"} />
        </FormGrid>
        <SelectField
          name="relationshipStatus"
          label="Relationship"
          options={["Active", "Cold", "VIP", "DoNotContact"]}
          defaultValue={owner?.relationshipStatus ?? "Active"}
        />
        <TextAreaField name="notes" label="Notes" defaultValue={owner?.notes} />
        <div className="flex gap-2">
          <SubmitButton>{mode === "create" ? "Add owner" : "Save"}</SubmitButton>
          <ButtonLink variant="ghost" href={owner ? `/owners/${owner.id}` : "/owners"}>Cancel</ButtonLink>
        </div>
      </div>
    </ActionForm>
  );
}
