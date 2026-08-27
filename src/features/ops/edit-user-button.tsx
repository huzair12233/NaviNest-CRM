"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, SelectField, CheckboxField } from "@/components/form/fields";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { updateUser } from "./actions";

export function EditUserButton({
  user,
}: {
  user: { id: string; name: string; email: string; phone: string | null; role: string; active: boolean };
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={`Edit ${user.name}`}>
        <ActionForm action={updateUser.bind(null, user.id)} onSuccess={() => setOpen(false)} successToast="Updated">
          <div className="space-y-4">
            <TextField name="name" label="Full name" required defaultValue={user.name} />
            <TextField name="email" label="Email" type="email" required defaultValue={user.email} />
            <TextField name="phone" label="Phone" type="tel" defaultValue={user.phone ?? ""} />
            <SelectField name="role" label="Role" options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} defaultValue={user.role} required />
            <TextField name="password" label="Reset password (leave blank to keep)" type="text" />
            <CheckboxField name="active" label="Active" defaultChecked={user.active} />
          </div>
          <div className="mt-6">
            <SubmitButton>Save</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>
    </>
  );
}
