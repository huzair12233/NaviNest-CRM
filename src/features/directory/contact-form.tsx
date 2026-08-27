"use client";

import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, TextAreaField, SelectField, FormGrid } from "@/components/form/fields";
import { ButtonLink } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-result";
import { CONTACT_TYPES } from "@/lib/constants";

export function ContactForm({
  action,
  mode,
  contact,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  mode: "create" | "edit";
  contact?: {
    id: string;
    name: string;
    phone: string;
    altPhone: string | null;
    whatsapp: string | null;
    email: string | null;
    type: string;
    notes: string | null;
  };
}) {
  return (
    <ActionForm
      action={action}
      successToast={mode === "create" ? "Contact added" : "Contact updated"}
      redirectOnSuccess={(s) => `/contacts/${(s.data?.id as string) ?? contact?.id ?? ""}`}
      className="max-w-xl"
    >
      <div className="card space-y-4 p-6">
        <TextField name="name" label="Name" required defaultValue={contact?.name} />
        <FormGrid>
          <TextField name="phone" label="Phone" type="tel" required defaultValue={contact?.phone} />
          <TextField name="altPhone" label="Alternate phone" type="tel" defaultValue={contact?.altPhone} />
          <TextField name="whatsapp" label="WhatsApp" type="tel" defaultValue={contact?.whatsapp} />
          <TextField name="email" label="Email" type="email" defaultValue={contact?.email} />
        </FormGrid>
        <SelectField name="type" label="Contact type" options={CONTACT_TYPES} defaultValue={contact?.type ?? "Buyer"} required />
        <TextAreaField name="notes" label="Notes" defaultValue={contact?.notes} />
        <div className="flex gap-2">
          <SubmitButton>{mode === "create" ? "Add contact" : "Save"}</SubmitButton>
          <ButtonLink variant="ghost" href={contact ? `/contacts/${contact.id}` : "/contacts"}>Cancel</ButtonLink>
        </div>
      </div>
    </ActionForm>
  );
}
