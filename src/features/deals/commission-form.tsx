"use client";

import * as React from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, TextAreaField, SelectField, FormGrid } from "@/components/form/fields";
import { COMMISSION_STATUSES } from "@/lib/constants";
import { updateCommission } from "./actions";

export function CommissionForm({
  dealId,
  dealValue,
  commission,
  label = "Update commission",
}: {
  dealId: string;
  dealValue: number;
  commission?: {
    dealValue: number;
    percentage: number;
    receivedAmount: number;
    employeeSharePct: number;
    status: string;
    notes: string | null;
    paymentDate: Date | null;
  } | null;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Coins className="h-4 w-4" /> {label}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Commission" description="Only managers can edit financials">
        <ActionForm action={updateCommission.bind(null, dealId)} onSuccess={() => setOpen(false)} successToast="Commission updated">
          <FormGrid>
            <TextField name="dealValue" label="Deal value (₹)" type="number" defaultValue={commission?.dealValue ?? dealValue} required />
            <TextField name="percentage" label="Commission %" type="number" defaultValue={commission?.percentage ?? 1.5} required />
            <TextField name="receivedAmount" label="Received so far (₹)" type="number" defaultValue={commission?.receivedAmount ?? 0} />
            <TextField name="employeeSharePct" label="Employee share %" type="number" defaultValue={commission?.employeeSharePct ?? 30} />
            <TextField name="paymentDate" label="Last payment date" type="date" defaultValue={commission?.paymentDate ? new Date(commission.paymentDate).toISOString().slice(0, 10) : undefined} />
            <SelectField name="status" label="Status" options={COMMISSION_STATUSES} defaultValue={commission?.status ?? "Pending"} />
          </FormGrid>
          <TextAreaField name="notes" label="Notes" defaultValue={commission?.notes} className="mt-4" />
          <div className="mt-5">
            <SubmitButton>Save commission</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>
    </>
  );
}
