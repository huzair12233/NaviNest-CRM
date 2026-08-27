import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isManager } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/misc";
import { LeadForm } from "@/features/leads/lead-form";
import { updateLead } from "@/features/leads/actions";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [lead, sources, partners, team] = await Promise.all([
    db.lead.findUnique({ where: { id } }),
    db.leadSource.findMany({ where: { active: true }, orderBy: { sortkey: "asc" }, select: { id: true, name: true } }),
    db.channelPartner.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!lead) notFound();

  return (
    <>
      <PageHeader
        title={`Edit ${lead.fullName}`}
        breadcrumb={[{ label: "Leads", href: "/leads" }, { label: lead.code, href: `/leads/${id}` }, { label: "Edit" }]}
      />
      <LeadForm
        mode="edit"
        action={updateLead.bind(null, id)}
        lead={lead}
        sources={sources}
        partners={partners}
        team={team}
        canAssign={isManager(user)}
      />
    </>
  );
}
