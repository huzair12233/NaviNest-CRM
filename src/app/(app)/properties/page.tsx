import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProperties } from "@/features/properties/queries";
import { getParam, type SearchParams } from "@/lib/pagination";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Badge, propertyStatusTone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { SearchBox, FilterSelect, ClearFilters, Pagination } from "@/components/ui/query-controls";
import { PROPERTY_TYPES, PROPERTY_STATUSES, BHK_OPTIONS, PROPERTY_LISTING_TYPES, PROPERTY_LISTING_LABELS } from "@/lib/constants";
import { inr, listingPrice } from "@/lib/utils";
import { parsePhotos, cldCard } from "@/lib/photos";
import { Building, Plus, ImageIcon } from "lucide-react";

const KEYS = ["q", "listingType", "segment", "propertyType", "status", "bhk", "priceMin", "priceMax", "sort"];

// Preset amounts for the Budget dropdowns — scale changes with the listing type,
// since ₹25,000 is a sensible rent but a meaningless sale price.
const SALE_BUDGET_PRESETS = [
  2000000, 3000000, 4000000, 5000000, 6000000, 8000000, 10000000, 15000000, 20000000, 30000000, 50000000,
];
const RENT_BUDGET_PRESETS = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000];

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  await requireUser();
  const { rows, total, page, pageSize } = await getProperties(sp);

  const isRentFilter = getParam(sp, "listingType") === "RENT";
  const budgetPresets = isRentFilter ? RENT_BUDGET_PRESETS : SALE_BUDGET_PRESETS;
  const formatBudget = (v: number) => (isRentFilter ? `${inr(v)}/mo` : inr(v));

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
        <FilterSelect
          name="listingType"
          options={PROPERTY_LISTING_TYPES.map((v) => ({ value: v, label: PROPERTY_LISTING_LABELS[v] }))}
          allLabel="All types"
        />
        <FilterSelect name="segment" options={["Residential", "Commercial"]} />
        <FilterSelect name="propertyType" label="Type" options={PROPERTY_TYPES} />
        <FilterSelect name="bhk" label="BHK" options={BHK_OPTIONS.map((b) => ({ value: String(b), label: `${b} BHK` }))} />
        <FilterSelect name="status" options={PROPERTY_STATUSES} />
        <FilterSelect
          name="priceMin"
          label="Budget"
          options={budgetPresets.map((v) => ({ value: String(v), label: formatBudget(v) }))}
          allLabel="No min"
        />
        <FilterSelect
          name="priceMax"
          options={budgetPresets.map((v) => ({ value: String(v), label: formatBudget(v) }))}
          allLabel="No max"
        />
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
              {rows.map((p) => {
                const cover = parsePhotos(p.photos)[0];
                return (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/properties/${p.id}`} className="flex items-center gap-3">
                      <span className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-ink-100 text-ink-300">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cldCard(cover.url)} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-ink-900 hover:text-brand-700">{p.title}</span>
                        <span className="mt-0.5 block text-xs text-ink-400">
                          {p.code} · {PROPERTY_LISTING_LABELS[p.listingType] ?? p.listingType} · {p.segment}
                        </span>
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
                    {listingPrice(p)}
                  </TD>
                  <TD className="text-sm text-ink-500">{p.owner?.name ?? "—"}</TD>
                  <TD>
                    <Badge tone={propertyStatusTone(p.status)}>{p.status}</Badge>
                  </TD>
                  <TD align="right" className="text-xs text-ink-500">
                    {p._count.interests} leads · {p._count.siteVisits} visits
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
