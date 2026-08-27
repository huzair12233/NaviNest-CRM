import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { Building2 } from "lucide-react";

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #14b8a6 0, transparent 45%), radial-gradient(circle at 80% 70%, #0d9488 0, transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">NaviNest Realtors</span>
        </div>
        <div className="relative">
          <h1 className="max-w-md text-3xl font-semibold leading-tight">
            Every enquiry, follow-up and closing — in one place.
          </h1>
          <p className="mt-4 max-w-md text-sm text-brand-100/80">
            Track leads from first call to commission. Know what to work on today, where deals stand,
            and which sources actually bring business.
          </p>
        </div>
        <p className="relative text-xs text-brand-100/60">Navi Mumbai · Residential & Commercial</p>
      </div>

      {/* Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-ink-900">NaviNest CRM</span>
          </div>
          <h2 className="text-xl font-semibold text-ink-900">Sign in</h2>
          <p className="mt-1 text-sm text-ink-500">Welcome back. Enter your credentials to continue.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <div className="mt-6 rounded-lg border border-ink-200 bg-ink-50 p-3 text-xs text-ink-500">
            <p className="font-medium text-ink-600">Demo accounts (password: <code>navinest</code>)</p>
            <p className="mt-1">admin@navinest.in · priya@navinest.in (manager) · rahul@navinest.in (sales)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
