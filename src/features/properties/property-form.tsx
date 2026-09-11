"use client";

import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { TextField, TextAreaField, SelectField, FormGrid, FormSection } from "@/components/form/fields";
import { ButtonLink } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-result";
import {
  PROPERTY_TYPES,
  PROPERTY_LISTING_TYPES,
  PROPERTY_LISTING_LABELS,
  FURNISHINGS,
  POSSESSIONS,
  PROPERTY_STATUSES,
  BHK_OPTIONS,
} from "@/lib/constants";

type Owner = { id: string; name: string };

export function PropertyForm({
  action,
  owners,
  mode,
  property,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  owners: Owner[];
  mode: "create" | "edit";
  property?: Record<string, unknown> & { id: string; projectName?: string | null };
}) {
  const p: Record<string, unknown> = property ?? {};
  const g = (k: string) => (p[k] as string | number | null | undefined) ?? undefined;
  const amenities =
    typeof p.amenities === "string"
      ? p.amenities
      : Array.isArray(p.amenities)
        ? (p.amenities as string[]).join(", ")
        : "";

  return (
    <ActionForm
      action={action}
      successToast={mode === "create" ? "Property added" : "Property updated"}
      redirectOnSuccess={(s) => `/properties/${(s.data?.id as string) ?? property?.id ?? ""}`}
      className="max-w-3xl"
    >
      <div className="card p-6">
        <FormSection title="Basics">
          <TextField name="title" label="Listing title" required defaultValue={g("title") as string} placeholder="2 BHK Apartment in Bhagwati Greens" />
          <FormGrid cols={3}>
            <SelectField
              name="listingType"
              label="Listing"
              options={PROPERTY_LISTING_TYPES.map((v) => ({ value: v, label: PROPERTY_LISTING_LABELS[v] }))}
              defaultValue={(g("listingType") as string) ?? "SALE"}
              required
              className="mt-4"
            />
            <SelectField name="segment" label="Segment" options={["Residential", "Commercial"]} defaultValue={(g("segment") as string) ?? "Residential"} required className="mt-4" />
            <SelectField name="propertyType" label="Property type" options={PROPERTY_TYPES} defaultValue={(g("propertyType") as string) ?? "Apartment"} required className="mt-4" />
            <SelectField name="bhk" label="BHK" options={BHK_OPTIONS.map((b) => ({ value: String(b), label: `${b} BHK` }))} defaultValue={g("bhk") ? String(g("bhk")) : ""} placeholder="N/A" className="mt-4" />
            <SelectField name="status" label="Availability" options={PROPERTY_STATUSES} defaultValue={(g("status") as string) ?? "Available"} className="mt-4" />
            <SelectField name="possession" label="Possession" options={POSSESSIONS} defaultValue={(g("possession") as string) ?? "Ready"} className="mt-4" />
          </FormGrid>
        </FormSection>

        <FormSection title="Location">
          <FormGrid>
            <TextField name="location" label="Locality" required defaultValue={g("location") as string} placeholder="Kharghar" />
            <TextField name="projectName" label="Project / Society" defaultValue={property?.projectName ?? undefined} placeholder="Bhagwati Greens" />
            <TextField name="city" label="City" defaultValue={(g("city") as string) ?? "Navi Mumbai"} />
          </FormGrid>
          <TextField name="address" label="Full address" defaultValue={g("address") as string} className="mt-4" />
        </FormSection>

        <FormSection title="Configuration">
          <FormGrid cols={3}>
            <TextField name="carpetArea" label="Carpet area (sqft)" type="number" defaultValue={g("carpetArea")} />
            <TextField name="builtupArea" label="Built-up area (sqft)" type="number" defaultValue={g("builtupArea")} />
            <SelectField name="furnishing" label="Furnishing" options={FURNISHINGS} defaultValue={(g("furnishing") as string) ?? "Unfurnished"} />
            <TextField name="floor" label="Floor" type="number" defaultValue={g("floor")} />
            <TextField name="totalFloors" label="Total floors" type="number" defaultValue={g("totalFloors")} />
            <TextField name="ageYears" label="Age (years)" type="number" defaultValue={g("ageYears")} />
            <TextField name="bathrooms" label="Bathrooms" type="number" defaultValue={g("bathrooms")} />
            <TextField name="balcony" label="Balconies" type="number" defaultValue={g("balcony")} />
            <TextField name="parking" label="Parking spots" type="number" defaultValue={g("parking") ?? 0} />
          </FormGrid>
          <TextField name="amenities" label="Amenities" hint="Comma-separated" defaultValue={amenities} className="mt-4" />
        </FormSection>

        <FormSection title="Commercials">
          <FormGrid cols={2}>
            <TextField name="salePrice" label="Sale price (₹)" type="number" defaultValue={g("salePrice")} hint="For sale listings" />
            <TextField name="rent" label="Monthly rent (₹)" type="number" defaultValue={g("rent")} hint="For rental listings" />
            <TextField name="deposit" label="Deposit (₹)" type="number" defaultValue={g("deposit")} hint="Primary figure for Heavy Deposit listings" />
            <TextField name="maintenance" label="Maintenance (₹/mo)" type="number" defaultValue={g("maintenance")} />
          </FormGrid>
        </FormSection>

        <FormSection title="Owner & listing">
          <FormGrid>
            <SelectField name="ownerId" label="Owner" options={owners.map((o) => ({ value: o.id, label: o.name }))} defaultValue={(g("ownerId") as string) ?? ""} placeholder="Unlinked" />
            <TextField name="listingSource" label="Listing source" defaultValue={(g("listingSource") as string) ?? "Direct"} />
          </FormGrid>
          <TextAreaField name="description" label="Description" defaultValue={g("description") as string} className="mt-4" />
        </FormSection>

        {mode === "create" && (
          <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            📸 Save the listing first, then add photos from its page.
          </p>
        )}

        <div className="flex items-center gap-2">
          <SubmitButton>{mode === "create" ? "Add property" : "Save changes"}</SubmitButton>
          <ButtonLink variant="ghost" href={property ? `/properties/${property.id}` : "/properties"}>
            Cancel
          </ButtonLink>
        </div>
      </div>
    </ActionForm>
  );
}
