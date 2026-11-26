import { requireUser } from "@/lib/auth";
import { isManager } from "@/lib/rbac";
import { getCallListEntries } from "@/features/call-list/queries";
import { toQueryString, type SearchParams } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { TabLinks } from "@/components/ui/tabs";
import { CallListClient } from "@/features/call-list/call-list-client";
import { Download } from "lucide-react";

export default async function CallListPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const { rows, status, counts } = await getCallListEntries(user, sp);
  const exportHref = `/api/export/call-list${toQueryString({ status })}`;

  const tabs = [
    { key: "Pending", label: "Pending", href: "/call-list?status=Pending", count: counts.Pending },
    { key: "Called", label: "Called", href: "/call-list?status=Called", count: counts.Called },
    { key: "Skipped", label: "Skipped", href: "/call-list?status=Skipped", count: counts.Skipped },
    { key: "Converted", label: "Converted", href: "/call-list?status=Converted", count: counts.Converted },
    { key: "All", label: "All", href: "/call-list?status=All" },
  ];

  return (
    <>
      <PageHeader
        title="Call List"
        subtitle="Paste a raw cold-calling list, work through it with Call/WhatsApp, and save the good ones as Leads."
        actions={
          isManager(user) ? (
            <ButtonLink href={exportHref} size="sm" variant="outline">
              <Download className="h-4 w-4" /> Download report
            </ButtonLink>
          ) : undefined
        }
      />
      <div className="mb-4">
        <TabLinks tabs={tabs} active={status} />
      </div>
      <CallListClient rows={rows} />
    </>
  );
}
