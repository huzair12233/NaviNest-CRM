import Link from "next/link";
import { Building2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-ink-900">Page not found</h1>
        <p className="mt-1 text-sm text-ink-500">The record or page you’re looking for doesn’t exist.</p>
        <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
