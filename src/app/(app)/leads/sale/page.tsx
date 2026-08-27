import { LeadsView } from "@/features/leads/leads-view";
import type { SearchParams } from "@/lib/pagination";

export default async function SaleLeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  return (
    <LeadsView
      sp={sp}
      interest="SALE"
      title="Sale Leads"
      subtitle="Buyers and investors looking to purchase."
      breadcrumb={[{ label: "Leads", href: "/leads" }, { label: "Sale" }]}
    />
  );
}
