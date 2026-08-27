import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dealScope } from "@/lib/rbac";
import { PageHeader, Avatar } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { OPEN_PIPELINE_STAGES } from "@/lib/constants";
import { inr, formatDate } from "@/lib/utils";
import { DealMoveControls } from "@/features/deals/move-controls";
import { Plus } from "lucide-react";

export default async function PipelinePage() {
  const user = await requireUser();
  const deals = await db.deal.findMany({
    where: { AND: [dealScope(user), { stage: { notIn: ["Closed Won", "Closed Lost"] } }] },
    orderBy: { updatedAt: "desc" },
    include: {
      lead: { select: { id: true, fullName: true } },
      property: { select: { title: true, location: true } },
      assignedTo: { select: { name: true, avatarColor: true } },
    },
  });

  const byStage = OPEN_PIPELINE_STAGES.map((s) => ({
    ...s,
    deals: deals.filter((d) => d.stage === s.key),
    total: deals.filter((d) => d.stage === s.key).reduce((sum, d) => sum + d.value, 0),
  }));
  const wtd = deals.reduce((s, d) => s + (d.value * d.probability) / 100, 0);

  return (
    <>
      <PageHeader
        title="Sales Pipeline"
        subtitle={`${deals.length} open deals · ${inr(deals.reduce((s, d) => s + d.value, 0))} gross · ${inr(wtd)} weighted`}
        actions={<ButtonLink href="/deals/new" size="sm"><Plus className="h-4 w-4" /> New Deal</ButtonLink>}
      />

      <div className="flex items-start gap-3 overflow-x-auto scroll-thin pb-4">
        {byStage.map((col) => (
          <div key={col.key} className="flex w-72 shrink-0 flex-col rounded-xl bg-ink-100/60">
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm font-semibold text-ink-700">{col.label}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-500">{col.deals.length}</span>
            </div>
            <div className="px-3 pb-1 text-xs text-ink-400">{inr(col.total)}</div>
            <div className="flex min-h-[80px] flex-col gap-2 p-2">
              {col.deals.map((d) => (
                <div key={d.id} className="card p-3">
                  <Link href={`/deals/${d.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">
                    {d.title}
                  </Link>
                  <p className="mt-1 text-xs text-ink-400">
                    {d.lead ? d.lead.fullName : "No lead"} · {d.property?.location ?? "—"}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-800">{inr(d.value)}</span>
                    <span className="text-xs text-ink-400">{d.probability}%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2">
                    <span className="flex items-center gap-1.5 text-xs text-ink-400">
                      {d.assignedTo && <Avatar name={d.assignedTo.name} color={d.assignedTo.avatarColor} size={16} />}
                      {d.expectedCloseDate ? formatDate(d.expectedCloseDate) : "No date"}
                    </span>
                    <DealMoveControls dealId={d.id} stage={d.stage} />
                  </div>
                </div>
              ))}
              {col.deals.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-ink-300">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
