import type { Lead, Property } from "@prisma/client";
import { toArray } from "./utils";

/**
 * Rule-based property matching (NOT AI). Produces a 0–100 score by weighting
 * how well an available property fits a lead's captured requirement.
 *
 * Weights (total 100):
 *   listing type / segment   hard filter (score 0 if wrong)
 *   location                 30
 *   budget                   25
 *   BHK                      15
 *   property type            12
 *   carpet area              10
 *   furnishing                4
 *   parking                   4
 */
export type MatchResult = {
  property: Property;
  score: number;
  reasons: string[];
  gaps: string[];
};

export function scoreMatch(lead: Lead, property: Property): MatchResult | null {
  const reasons: string[] = [];
  const gaps: string[] = [];

  // Hard filters
  const wantRent = lead.interest === "RENT";
  const wantSale = lead.interest === "SALE";
  const wantHeavyDeposit = lead.interest === "HEAVY_DEPOSIT";
  if (wantRent && property.listingType !== "RENT") return null;
  if (wantSale && property.listingType !== "SALE") return null;
  if (wantHeavyDeposit && property.listingType !== "HEAVY_DEPOSIT") return null;
  // Heavy Deposit is its own category — don't let a generic (BOTH) lead match it either.
  if (!wantHeavyDeposit && property.listingType === "HEAVY_DEPOSIT") return null;
  if (!["Available", "Hold"].includes(property.status)) return null;

  let score = 0;

  // Location (30)
  const wantLocations = toArray(lead.locations).map((l) => l.toLowerCase());
  const propLoc = property.location.toLowerCase();
  if (wantLocations.length === 0) {
    score += 15;
  } else if (wantLocations.some((l) => propLoc.includes(l) || l.includes(property.location.toLowerCase()))) {
    score += 30;
    reasons.push(`Location match: ${property.location}`);
  } else if (lead.preferredProject && property.location.toLowerCase().includes(lead.preferredProject.toLowerCase())) {
    score += 20;
  } else {
    gaps.push(`Wants ${wantLocations.join(", ")}`);
  }

  // Budget (25) — heavy-deposit compares against the property's deposit amount
  const price =
    property.listingType === "HEAVY_DEPOSIT"
      ? property.deposit
      : property.listingType === "RENT"
        ? property.rent
        : property.salePrice;
  const min = property.listingType === "RENT" ? lead.rentMin : lead.budgetMin;
  const max = property.listingType === "RENT" ? lead.rentMax : lead.budgetMax;
  if (price == null || (min == null && max == null)) {
    score += 12;
  } else if ((min == null || price >= min * 0.9) && (max == null || price <= max * 1.05)) {
    score += 25;
    reasons.push("Within budget");
  } else if (max != null && price <= max * 1.15) {
    score += 14;
    gaps.push("Slightly above budget");
  } else {
    gaps.push("Outside budget");
  }

  // BHK (15)
  if (lead.bhk == null || property.bhk == null) {
    score += 7;
  } else if (property.bhk === lead.bhk) {
    score += 15;
    reasons.push(`${property.bhk} BHK`);
  } else if (Math.abs(property.bhk - lead.bhk) <= 0.5) {
    score += 9;
  } else {
    gaps.push(`Wants ${lead.bhk} BHK`);
  }

  // Property type (12)
  if (!lead.propertyType) {
    score += 6;
  } else if (lead.propertyType === property.propertyType) {
    score += 12;
  } else {
    gaps.push(`Wants ${lead.propertyType}`);
  }

  // Carpet area (10)
  if (lead.areaMin == null && lead.areaMax == null) {
    score += 5;
  } else if (property.carpetArea != null) {
    const okMin = lead.areaMin == null || property.carpetArea >= lead.areaMin * 0.9;
    const okMax = lead.areaMax == null || property.carpetArea <= lead.areaMax * 1.15;
    if (okMin && okMax) {
      score += 10;
      reasons.push(`${property.carpetArea} sqft`);
    } else {
      score += 3;
    }
  }

  // Furnishing (4)
  if (!lead.furnishing || lead.furnishing === "Any") score += 2;
  else if (lead.furnishing === property.furnishing) {
    score += 4;
    reasons.push(property.furnishing);
  }

  // Parking (4)
  if (!lead.parkingReq) score += 2;
  else if (property.parking > 0) {
    score += 4;
    reasons.push("Parking available");
  } else gaps.push("Needs parking");

  return { property, score: Math.min(100, Math.round(score)), reasons, gaps };
}

export function matchProperties(lead: Lead, properties: Property[], limit = 8): MatchResult[] {
  return properties
    .map((p) => scoreMatch(lead, p))
    .filter((m): m is MatchResult => m != null && m.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type LeadMatchResult = {
  lead: Lead;
  score: number;
  reasons: string[];
  gaps: string[];
};

/** Reverse: which open leads would be interested in this property. */
export function matchLeads(property: Property, leads: Lead[], limit = 12): LeadMatchResult[] {
  return leads
    .map((l) => {
      const m = scoreMatch(l, property);
      return m ? { lead: l, score: m.score, reasons: m.reasons, gaps: m.gaps } : null;
    })
    .filter((m): m is LeadMatchResult => m != null && m.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function matchBadge(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: "Excellent", tone: "emerald" };
  if (score >= 70) return { label: "Strong", tone: "blue" };
  if (score >= 55) return { label: "Fair", tone: "amber" };
  return { label: "Weak", tone: "slate" };
}
