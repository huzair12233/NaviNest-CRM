"use client";

import * as React from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, TextAreaField, SelectField, FormGrid } from "@/components/form/fields";
import { SITE_VISIT_STATUSES } from "@/lib/constants";
import { recordSiteVisitFeedback } from "./actions";

export function SiteVisitFeedbackButton({
  visitId,
  size = "sm",
  label = "Feedback",
}: {
  visitId: string;
  size?: "sm" | "md";
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size={size} variant="outline" onClick={() => setOpen(true)}>
        <ClipboardCheck className="h-4 w-4" /> {label}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Site visit feedback" width="md">
        <ActionForm
          action={recordSiteVisitFeedback.bind(null, visitId)}
          onSuccess={() => setOpen(false)}
          successToast="Feedback saved"
        >
          <FormGrid>
            <SelectField name="status" label="Visit status" options={SITE_VISIT_STATUSES} defaultValue="Completed" required />
            <SelectField name="interested" label="Client interested?" options={["Yes", "Maybe", "No"]} placeholder="—" />
            <SelectField name="rating" label="Rating (1–5)" options={["1", "2", "3", "4", "5"]} placeholder="—" />
            <TextField name="competitor" label="Competitor property seen" />
          </FormGrid>
          <TextAreaField name="liked" label="What the client liked" className="mt-4" />
          <TextAreaField name="disliked" label="Concerns / what they disliked" className="mt-4" />
          <TextAreaField name="objections" label="Objections" className="mt-4" />
          <TextField name="priceFeedback" label="Price feedback" className="mt-4" />
          <TextField name="nextAction" label="Next action" className="mt-4" />
          <TextField name="nextFollowUpAt" label="Schedule next follow-up" type="datetime-local" className="mt-4" />
          <div className="mt-5">
            <SubmitButton>Save feedback</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>
    </>
  );
}
