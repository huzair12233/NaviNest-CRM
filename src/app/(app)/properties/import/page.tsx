import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { PropertyImportWizard } from "@/features/properties/import-wizard";

export default async function PropertyImportPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="Import Properties"
        subtitle="Upload an Excel or CSV file. We'll auto-detect columns, flag possible duplicates, and let you review before anything is saved."
        breadcrumb={[{ label: "Properties", href: "/properties" }, { label: "Import" }]}
      />
      <PropertyImportWizard />
    </>
  );
}
