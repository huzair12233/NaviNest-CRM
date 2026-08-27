import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProperties } from "@/features/properties/queries";
import type { SearchParams } from "@/lib/pagination";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Badge, propertyStatusTone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { SearchBox, FilterSelect, ClearFilters, Pagination } from "@/components/ui/query-controls";
import { PROPERTY_TYPES, PROPERTY_STATUSES, BHK_OPTIONS } from "@/lib/constants";
import { inr } from "@/lib/utils";
import { Building, Plus } from "lucide-react";

const KEYS = ["q", "listingType", "segment", "propertyType", "status", "bhk", "sort"];

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  await requireUser();
  const { rows, total, page, pageSize } = await getProperties(sp);

  return (
    <>
      <PageHeader
        title="Properties"
        subtitle="NaviNest inventory — sale and rental, with live availability."
        actions={
          <ButtonLink href="/properties/new" size="sm">
            <Plus className="h-4 w-4" /> Add Property
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBox placeholder="Title, code or location…" />
        <FilterSelect name="listingType" options={[{ value: "SALE", label: "For Sale" }, { value: "RENT", label: "For Rent" }]} allLabel="Sale + Rent" />
        <FilterSelect name="segment" options={["Residential", "Commercial"]} />
        <FilterSelect name="propertyType" label="Type" options={PROPERTY_TYPES} />
        <FilterSelect name="bhk" label="BHK" options={BHK_OPTIONS.map((b) => ({ value: String(b), label: `${b} BHK` }))} />
        <FilterSelect name="status" options={PROPERTY_STATUSES} />
        <FilterSelect
          name="sort"
          options={[
            { value: "recent", label: "Sort: Newest" },
            { value: "price-desc", label: "Sort: Price high → low" },
            { value: "price-asc", label: "Sort: Price low → high" },
          ]}
          allLabel="Sort: Newest"
        />
        <ClearFilters keys={KEYS} />
        <span className="ml-auto text-sm text-ink-400">{total} properties</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No properties match"
          description="Add a listing or clear the filters."
          action={<ButtonLink href="/properties/new" size="sm"><Plus className="h-4 w-4" /> Add Property</ButtonLink>}
        />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Property</TH>
                <TH>Location</TH>
                <TH>Config</TH>
                <TH align="right">Price</TH>
                <TH>Owner</TH>
                <TH>Status</TH>
                <TH align="right">Interest</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/properties/${p.id}`} className="block">
                      <span className="font-medium text-ink-900 hover:text-brand-700">{p.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-400">
                        {p.code} · {p.listingType === "RENT" ? "Rent" : "Sale"} · {p.segment}
                      </span>
                    </Link>
                  </TD>
                  <TD className="text-sm">
                    {p.location}
                    {p.project && <span className="block text-xs text-ink-400">{p.project.name}</span>}
                  </TD>
                  <TD className="whitespace-nowrap text-sm">
                    {p.bhk ? `${p.bhk} BHK` : p.propertyType}
                    {p.carpetArea ? <span className="block text-xs text-ink-400">{p.carpetArea} sqft</span> : null}
                  </TD>
                  <TD align="right" className="whitespace-nowrap font-medium">
                    {p.listingType === "RENT" ? `${inr(p.rent)}/mo` : inr(p.salePrice)}
                  </TD>
                  <TD className="text-sm text-ink-500">{p.owner?.name ?? "—"}</TD>
                  <TD>
                    <Badge tone={propertyStatusTone(p.status)}>{p.status}</Badge>
                  </TD>
                  <TD align="right" className="text-xs text-ink-500">
                    {p._count.interests} leads · {p._count.siteVisits} visits
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} pageSize={pageSize} total={total} />
        </>
      )}
    </>
  );
}
