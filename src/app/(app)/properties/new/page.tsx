import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { PropertyForm } from "@/features/properties/property-form";
import { createProperty } from "@/features/properties/actions";

export default async function NewPropertyPage() {
  await requireUser();
  const owners = await db.owner.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader title="Add Property" breadcrumb={[{ label: "Properties", href: "/properties" }, { label: "New" }]} />
      <PropertyForm mode="create" action={createProperty} owners={owners} />
    </>
  );
}
