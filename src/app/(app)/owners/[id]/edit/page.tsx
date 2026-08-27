import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { OwnerForm } from "@/features/directory/owner-form";
import { updateOwner } from "@/features/directory/actions";

export default async function EditOwnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const owner = await db.owner.findUnique({ where: { id } });
  if (!owner) notFound();
  return (
    <>
      <PageHeader title={`Edit ${owner.name}`} breadcrumb={[{ label: "Owners", href: "/owners" }, { label: owner.name, href: `/owners/${id}` }, { label: "Edit" }]} />
      <OwnerForm mode="edit" action={updateOwner.bind(null, id)} owner={owner} />
    </>
  );
}
