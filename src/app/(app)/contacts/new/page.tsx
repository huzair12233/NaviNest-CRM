import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { ContactForm } from "@/features/directory/contact-form";
import { createContact } from "@/features/directory/actions";

export default async function NewContactPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Add Contact" breadcrumb={[{ label: "Contacts", href: "/contacts" }, { label: "New" }]} />
      <ContactForm mode="create" action={createContact} />
    </>
  );
}
