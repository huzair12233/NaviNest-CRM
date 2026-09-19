import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { LeadImportWizard } from "@/features/leads/import-wizard";

export default async function LeadImportPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="Import Leads"
        subtitle="Upload an Excel or CSV file. We'll auto-detect columns, flag duplicates, and let you review before anything is saved."
        breadcrumb={[{ label: "Leads", href: "/leads" }, { label: "Import" }]}
      />
      <LeadImportWizard />
    </>
  );
}
