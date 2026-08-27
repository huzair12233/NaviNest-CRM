"use client";

import * as React from "react";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { SelectField, TextAreaField } from "@/components/form/fields";
import { PIPELINE_STAGES } from "@/lib/constants";
import { changeDealStage } from "./actions";

export function DealStageChanger({ dealId, stage }: { dealId: string; stage: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <GitBranch className="h-4 w-4" /> Change stage
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Change deal stage" description={`Current: ${stage}`}>
        <ActionForm action={changeDealStage.bind(null, dealId)} onSuccess={() => setOpen(false)}>
          <SelectField
            name="stage"
            label="New stage"
            options={PIPELINE_STAGES.map((s) => ({ value: s.key, label: `${s.label} (${s.probability}%)` }))}
            defaultValue={stage}
            required
          />
          <TextAreaField name="lostReason" label="Reason (if marking lost)" className="mt-4" />
          <div className="mt-5">
            <SubmitButton>Update stage</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>
    </>
  );
}
