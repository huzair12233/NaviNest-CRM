import { requireUser } from "@/lib/auth";
import { isManager } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/misc";
import { DealForm } from "@/features/deals/deal-form";
import { dealFormOptions } from "@/features/deals/form-data";
import { createDeal } from "@/features/deals/actions";

export default async function NewDealPage() {
  const user = await requireUser();
  const opts = await dealFormOptions();
  return (
    <>
      <PageHeader title="New Deal" breadcrumb={[{ label: "Pipeline", href: "/pipeline" }, { label: "New" }]} />
      <DealForm mode="create" action={createDeal} canAssign={isManager(user)} {...opts} />
    </>
  );
}
