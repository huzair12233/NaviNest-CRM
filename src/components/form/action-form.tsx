"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-result";

const idle: ActionState = { ok: false };

type Ctx = { errors: Record<string, string>; pending: boolean };
const FormCtx = React.createContext<Ctx>({ errors: {}, pending: false });

export function useFieldError(name: string) {
  return React.useContext(FormCtx).errors[name];
}

function Inner({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const ctx = React.useContext(FormCtx);
  return <FormCtx.Provider value={{ ...ctx, pending }}>{children}</FormCtx.Provider>;
}

export function ActionForm({
  action,
  children,
  onSuccess,
  successToast,
  // Server Actions here already call revalidatePath(), which makes Next refresh the
  // affected route automatically — so an extra router.refresh() just doubles the work.
  // Opt in only for the rare action that can't revalidate its own path.
  refreshOnSuccess = false,
  redirectOnSuccess,
  className,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  onSuccess?: (state: ActionState) => void;
  successToast?: string;
  refreshOnSuccess?: boolean;
  redirectOnSuccess?: string | ((s: ActionState) => string);
  className?: string;
}) {
  const [state, formAction] = useActionState(action, idle);
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef<ActionState | null>(null);

  React.useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state.ok) {
      if (successToast || state.message) toast("success", successToast ?? state.message!);
      onSuccess?.(state);
      if (redirectOnSuccess) {
        const to = typeof redirectOnSuccess === "function" ? redirectOnSuccess(state) : redirectOnSuccess;
        router.push(to);
      } else if (refreshOnSuccess) {
        router.refresh();
      }
    } else if (state.message && !state.errors) {
      toast("error", state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className={className}>
      <FormCtx.Provider value={{ errors: state.errors ?? {}, pending: false }}>
        <Inner>
          {state.message && state.errors && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {state.message}
            </div>
          )}
          {children}
        </Inner>
      </FormCtx.Provider>
    </form>
  );
}

export function SubmitButton({
  children = "Save",
  className,
  size,
}: {
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { pending } = React.useContext(FormCtx);
  return (
    <Button type="submit" disabled={pending} className={className} size={size}>
      {pending ? "Saving…" : children}
    </Button>
  );
}
