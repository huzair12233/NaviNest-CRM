import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { PropertyForm } from "@/features/properties/property-form";
import { updateProperty } from "@/features/properties/actions";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const [property, owners] = await Promise.all([
    db.property.findUnique({ where: { id }, include: { project: { select: { name: true } } } }),
    db.owner.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!property) notFound();

  return (
    <>
      <PageHeader
        title={`Edit ${property.title}`}
        breadcrumb={[{ label: "Properties", href: "/properties" }, { label: property.code, href: `/properties/${id}` }, { label: "Edit" }]}
      />
      <PropertyForm
        mode="edit"
        action={updateProperty.bind(null, id)}
        owners={owners}
        property={{ ...property, projectName: property.project?.name ?? null }}
      />
    </>
  );
}
