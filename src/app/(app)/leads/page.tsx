import { LeadsView } from "@/features/leads/leads-view";
import type { SearchParams } from "@/lib/pagination";

export default async function AllLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  return <LeadsView sp={sp} title="All Leads" subtitle="Every enquiry across sale and rental." />;
}
