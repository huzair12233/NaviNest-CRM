"use client";

import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField } from "@/components/form/fields";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef}>
      <ActionForm action={changePassword} successToast="Password changed" onSuccess={() => wrapperRef.current?.querySelector("form")?.reset()}>
        <TextField name="currentPassword" label="Current password" type="password" required />
        <TextField name="newPassword" label="New password" type="password" required hint="At least 8 characters" />
        <TextField name="confirmPassword" label="Confirm new password" type="password" required />
        <div className="mt-4">
          <SubmitButton>Change password</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
