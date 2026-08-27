import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isManager } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/misc";
import { LeadForm } from "@/features/leads/lead-form";
import { createLead } from "@/features/leads/actions";

export default async function NewLeadPage() {
  const user = await requireUser();
  const [sources, partners, team] = await Promise.all([
    db.leadSource.findMany({ where: { active: true }, orderBy: { sortkey: "asc" }, select: { id: true, name: true } }),
    db.channelPartner.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="New Lead"
        subtitle="Capture the enquiry and requirement. We'll check for duplicates automatically."
        breadcrumb={[{ label: "Leads", href: "/leads" }, { label: "New" }]}
      />
      <LeadForm
        mode="create"
        action={createLead}
        sources={sources}
        partners={partners}
        team={team}
        canAssign={isManager(user)}
      />
    </>
  );
}
