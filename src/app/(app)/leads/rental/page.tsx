import { LeadsView } from "@/features/leads/leads-view";
import type { SearchParams } from "@/lib/pagination";

export default async function RentalLeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  return (
    <LeadsView
      sp={sp}
      interest="RENT"
      title="Rental Leads"
      subtitle="Tenants looking for a place, with rent, deposit and move-in tracked."
      breadcrumb={[{ label: "Leads", href: "/leads" }, { label: "Rental" }]}
    />
  );
}
