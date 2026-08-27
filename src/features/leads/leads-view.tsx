import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLeads, getLeadFilterOptions, ageTone } from "./queries";
import type { SearchParams } from "@/lib/pagination";
import { PageHeader, EmptyState, Avatar } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Badge, statusTone, temperatureTone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import {
  SearchBox,
  FilterSelect,
  ClearFilters,
  Pagination,
} from "@/components/ui/query-controls";
import {
  LEAD_STATUSES,
  TEMPERATURES,
  PRIORITIES,
  BHK_OPTIONS,
  AGEING_BUCKETS,
} from "@/lib/constants";
import { inr, inrRange, relativeTime, toArray } from "@/lib/utils";
import { Users, Plus, Phone } from "lucide-react";

const FILTER_KEYS = ["q", "status", "temperature", "priority", "assignedToId", "sourceId", "bhk", "age", "bucket", "location", "sort"];

export async function LeadsView({
  sp,
  title,
  subtitle,
  interest,
  breadcrumb,
}: {
  sp: SearchParams;
  title: string;
  subtitle: string;
  interest?: "SALE" | "RENT";
  breadcrumb?: { label: string; href?: string }[];
}) {
  const user = await requireUser();
  const [{ rows, total, page, pageSize }, opts] = await Promise.all([
    getLeads(user, sp, interest ? { interest } : {}),
    getLeadFilterOptions(user),
  ]);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumb={breadcrumb}
        actions={
          <ButtonLink href="/leads/new" size="sm">
            <Plus className="h-4 w-4" /> New Lead
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBox placeholder="Name, phone or lead ID…" />
        <FilterSelect name="status" label="Status" options={LEAD_STATUSES} />
        <FilterSelect name="temperature" label="Temp" options={TEMPERATURES} />
        <FilterSelect name="priority" label="Priority" options={PRIORITIES} />
        <FilterSelect name="bhk" label="BHK" options={BHK_OPTIONS.map((b) => ({ value: String(b), label: `${b} BHK` }))} />
        <FilterSelect
          name="age"
          label="Ageing"
          options={AGEING_BUCKETS.map((b) => ({ value: b.key, label: b.label }))}
        />
        {opts.canFilterTeam && (
          <FilterSelect
            name="assignedToId"
            label="Owner"
            options={opts.team.map((t) => ({ value: t.id, label: t.name }))}
          />
        )}
        <FilterSelect name="sourceId" label="Source" options={opts.sources.map((s) => ({ value: s.id, label: s.name }))} />
        <FilterSelect
          name="sort"
          options={[
            { value: "recent", label: "Sort: Recent activity" },
            { value: "created", label: "Sort: Newest" },
            { value: "ageing", label: "Sort: Most stale" },
            { value: "name", label: "Sort: Name A–Z" },
          ]}
          allLabel="Sort: Recent activity"
        />
        <ClearFilters keys={FILTER_KEYS} />
        <span className="ml-auto text-sm text-ink-400">{total} leads</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads match these filters"
          description="Try clearing filters, or add a new enquiry."
          action={
            <ButtonLink href="/leads/new" size="sm">
              <Plus className="h-4 w-4" /> New Lead
            </ButtonLink>
          }
        />
      ) : (
        <>
          {/* Mobile: card list */}
          <ul className="space-y-2 sm:hidden">
            {rows.map((l) => {
              const locs = toArray(l.locations);
              return (
                <li key={l.id}>
                  <Link href={`/leads/${l.id}`} className="card block p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900">{l.fullName}</p>
                        <p className="text-xs text-ink-400">{l.code} · {l.phone}</p>
                      </div>
                      <Badge tone={temperatureTone(l.temperature)} dot>{l.temperature}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-ink-600">
                      {l.bhk ? `${l.bhk} BHK ` : ""}{l.propertyType ?? "—"}
                      {" · "}
                      {l.interest === "RENT" ? inrRange(l.rentMin, l.rentMax) : inrRange(l.budgetMin, l.budgetMax)}
                    </p>
                    {locs.length > 0 && <p className="truncate text-xs text-ink-400">{locs.join(", ")}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                      <span className="flex items-center gap-2 text-xs text-ink-400">
                        {l.nextFollowUp && (
                          <span className={new Date(l.nextFollowUp.dueAt) < new Date() ? "font-medium text-red-600" : ""}>
                            {relativeTime(l.nextFollowUp.dueAt)}
                          </span>
                        )}
                        <Badge tone={ageTone(l.ageDays)}>{l.ageDays === 0 ? "Today" : `${l.ageDays}d`}</Badge>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <Table className="hidden sm:block">
            <THead>
              <tr>
                <TH>Lead</TH>
                <TH>Requirement</TH>
                <TH>Budget</TH>
                <TH>Status</TH>
                <TH>Temp</TH>
                <TH>Owner</TH>
                <TH>Next follow-up</TH>
                <TH align="right">Age</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((l) => {
                const locs = toArray(l.locations);
                return (
                  <TR key={l.id}>
                    <TD>
                      <Link href={`/leads/${l.id}`} className="block">
                        <span className="font-medium text-ink-900 hover:text-brand-700">{l.fullName}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
                          <span>{l.code}</span>
                          <span>·</span>
                          <Phone className="h-3 w-3" />
                          {l.phone}
                        </span>
                      </Link>
                    </TD>
                    <TD>
                      <span className="text-sm text-ink-700">
                        {l.bhk ? `${l.bhk} BHK ` : ""}
                        {l.propertyType ?? "—"}
                      </span>
                      <span className="mt-0.5 block max-w-[180px] truncate text-xs text-ink-400">
                        {locs.length ? locs.join(", ") : "Location TBD"}
                      </span>
                    </TD>
                    <TD className="whitespace-nowrap text-sm">
                      {l.interest === "RENT"
                        ? inrRange(l.rentMin, l.rentMax)
                        : inrRange(l.budgetMin, l.budgetMax)}
                    </TD>
                    <TD>
                      <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={temperatureTone(l.temperature)} dot>
                        {l.temperature}
                      </Badge>
                    </TD>
                    <TD>
                      {l.assignedTo ? (
                        <span className="flex items-center gap-1.5 text-xs text-ink-600">
                          <Avatar name={l.assignedTo.name} color={l.assignedTo.avatarColor} size={20} />
                          {l.assignedTo.name.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-400">Unassigned</span>
                      )}
                    </TD>
                    <TD className="text-xs">
                      {l.nextFollowUp ? (
                        <span
                          className={
                            new Date(l.nextFollowUp.dueAt) < new Date() ? "font-medium text-red-600" : "text-ink-600"
                          }
                        >
                          {relativeTime(l.nextFollowUp.dueAt)}
                        </span>
                      ) : (
                        <span className="text-ink-300">None</span>
                      )}
                    </TD>
                    <TD align="right">
                      <Badge tone={ageTone(l.ageDays)}>{l.ageDays === 0 ? "Today" : `${l.ageDays}d`}</Badge>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <Pagination page={page} pageSize={pageSize} total={total} />
        </>
      )}
    </>
  );
}
