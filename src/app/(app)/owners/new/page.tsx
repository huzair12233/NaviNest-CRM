import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { OwnerForm } from "@/features/directory/owner-form";
import { createOwner } from "@/features/directory/actions";

export default async function NewOwnerPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Add Owner" breadcrumb={[{ label: "Owners", href: "/owners" }, { label: "New" }]} />
      <OwnerForm mode="create" action={createOwner} />
    </>
  );
}
