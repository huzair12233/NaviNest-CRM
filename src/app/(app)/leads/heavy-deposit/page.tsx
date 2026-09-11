import { LeadsView } from "@/features/leads/leads-view";
import type { SearchParams } from "@/lib/pagination";

export default async function HeavyDepositLeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  return (
    <LeadsView
      sp={sp}
      interest="HEAVY_DEPOSIT"
      title="Heavy Deposit Leads"
      subtitle="Deposit-based arrangements — the deposit amount is the primary figure, not monthly rent."
      breadcrumb={[{ label: "Leads", href: "/leads" }, { label: "Heavy Deposit" }]}
    />
  );
}
