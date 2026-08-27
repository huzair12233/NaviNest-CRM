"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, TextAreaField, SelectField } from "@/components/form/fields";
import { FOLLOWUP_TYPES } from "@/lib/constants";
import { completeFollowUp } from "./actions";

export function CompleteFollowUpButton({
  followUpId,
  size = "sm",
  label = "Complete",
}: {
  followUpId: string;
  size?: "sm" | "md";
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size={size} variant="outline" onClick={() => setOpen(true)}>
        <CheckCircle2 className="h-4 w-4" /> {label}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Complete follow-up">
        <ActionForm
          action={completeFollowUp.bind(null, followUpId)}
          onSuccess={() => setOpen(false)}
          successToast="Follow-up completed"
        >
          <TextAreaField name="outcome" label="Outcome" placeholder="What was discussed / decided?" />
          <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Schedule next follow-up (optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <TextField name="nextFollowUpAt" label="Next date & time" type="datetime-local" />
            <SelectField name="nextType" label="Type" options={FOLLOWUP_TYPES} defaultValue="Call" />
          </div>
          <div className="mt-5">
            <SubmitButton>Mark complete</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>
    </>
  );
}
