import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { ContactForm } from "@/features/directory/contact-form";
import { updateContact } from "@/features/directory/actions";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const contact = await db.contact.findUnique({ where: { id } });
  if (!contact) notFound();
  return (
    <>
      <PageHeader title={`Edit ${contact.name}`} breadcrumb={[{ label: "Contacts", href: "/contacts" }, { label: contact.name, href: `/contacts/${id}` }, { label: "Edit" }]} />
      <ContactForm mode="edit" action={updateContact.bind(null, id)} contact={contact} />
    </>
  );
}
