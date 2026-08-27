"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import type { ActionState } from "@/lib/action-result";

export function CreateDrawer({
  label,
  title,
  description,
  action,
  successToast,
  submitLabel = "Create",
  children,
}: {
  label: string;
  title: string;
  description?: string;
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  successToast?: string;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {label}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <ActionForm action={action} onSuccess={() => setOpen(false)} successToast={successToast}>
          <div className="space-y-4">{children}</div>
          <div className="mt-6">
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </ActionForm>
      </Drawer>
    </>
  );
}
