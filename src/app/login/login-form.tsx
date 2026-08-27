"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/features/auth/actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required defaultValue="admin@navinest.in" />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required defaultValue="navinest" />
      </Field>
      <SubmitButton />
    </form>
  );
}
