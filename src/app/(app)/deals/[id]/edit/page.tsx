import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isManager } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/misc";
import { DealForm } from "@/features/deals/deal-form";
import { dealFormOptions } from "@/features/deals/form-data";
import { updateDeal } from "@/features/deals/actions";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [deal, opts] = await Promise.all([db.deal.findUnique({ where: { id } }), dealFormOptions()]);
  if (!deal) notFound();
  return (
    <>
      <PageHeader title={`Edit ${deal.code}`} breadcrumb={[{ label: "Deals", href: "/deals" }, { label: deal.code, href: `/deals/${id}` }, { label: "Edit" }]} />
      <DealForm mode="edit" action={updateDeal.bind(null, id)} canAssign={isManager(user)} deal={deal} {...opts} />
    </>
  );
}
