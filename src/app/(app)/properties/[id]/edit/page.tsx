import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { PropertyForm } from "@/features/properties/property-form";
import { PhotoUploader } from "@/features/properties/photo-uploader";
import { updateProperty } from "@/features/properties/actions";
import { parsePhotos } from "@/lib/photos";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { Camera } from "lucide-react";

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

      <Card className="mb-5 max-w-3xl">
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Camera className="h-4 w-4 text-ink-400" /> Photos
            </span>
          }
          subtitle="Uploads save immediately"
        />
        <CardBody>
          <PhotoUploader propertyId={property.id} photos={parsePhotos(property.photos)} configured={cloudinaryConfigured()} />
        </CardBody>
      </Card>

      <PropertyForm
        mode="edit"
        action={updateProperty.bind(null, id)}
        owners={owners}
        property={{ ...property, projectName: property.project?.name ?? null }}
      />
    </>
  );
}
