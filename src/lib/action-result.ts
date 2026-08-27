import { z } from "zod";
import { flattenErrors } from "./validation";

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** optional payload, e.g. created id or a redirect target */
  data?: Record<string, unknown>;
};

export const idle: ActionState = { ok: false };

export function fail(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors };
}

export function ok(message?: string, data?: Record<string, unknown>): ActionState {
  return { ok: true, message, data };
}

export function fromZod(err: z.ZodError): ActionState {
  return { ok: false, message: "Please fix the highlighted fields", errors: flattenErrors(err) };
}

/** Turn FormData into a plain object (repeated keys ignored — use getAll where needed). */
export function formToObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}
