"use server";

import { redirect } from "next/navigation";
import { authenticate, destroySession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return { error: "Incorrect email or password" };
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
