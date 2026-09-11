// Central registry of enum-like values. Keeping these here (rather than DB enums)
// keeps the Prisma schema portable between SQLite (dev) and PostgreSQL (prod).

export const ROLES = ["ADMIN", "MANAGER", "SALES"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALES: "Sales Executive",
};

export const LEAD_TYPES = [
  "Buyer",
  "Tenant",
  "Seller",
  "Landlord",
  "Investor",
  "Owner",
  "Other",
] as const;

export const INTERESTS = ["SALE", "RENT", "HEAVY_DEPOSIT", "BOTH"] as const;
export const INTEREST_LABELS: Record<string, string> = {
  SALE: "Sale",
  RENT: "Rental",
  HEAVY_DEPOSIT: "Heavy Deposit",
  BOTH: "Sale + Rental",
};

// Property listing category — mirrors INTERESTS but this is what a *property*
// (rather than a lead's requirement) is listed as.
export const PROPERTY_LISTING_TYPES = ["SALE", "RENT", "HEAVY_DEPOSIT"] as const;
export const PROPERTY_LISTING_LABELS: Record<string, string> = {
  SALE: "For Sale",
  RENT: "For Rent",
  HEAVY_DEPOSIT: "Heavy Deposit",
};

// Lead lifecycle — ordered
export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Requirement Captured",
  "Property Shared",
  "Follow-up",
  "Site Visit Scheduled",
  "Site Visit Completed",
  "Negotiation",
  "Token / Booking",
  "Converted",
  "Lost",
  "Not Interested",
  "Future Requirement",
] as const;

export const OPEN_LEAD_STATUSES = LEAD_STATUSES.filter(
  (s) => !["Converted", "Lost", "Not Interested"].includes(s),
);

export const LEAD_STATUS_GROUP: Record<string, "open" | "won" | "lost" | "parked"> = {
  New: "open",
  Contacted: "open",
  Qualified: "open",
  "Requirement Captured": "open",
  "Property Shared": "open",
  "Follow-up": "open",
  "Site Visit Scheduled": "open",
  "Site Visit Completed": "open",
  Negotiation: "open",
  "Token / Booking": "open",
  Converted: "won",
  Lost: "lost",
  "Not Interested": "lost",
  "Future Requirement": "parked",
};

export const TEMPERATURES = ["Hot", "Warm", "Cold"] as const;
export const PRIORITIES = ["High", "Normal", "Low"] as const;

export const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "RowHouse",
  "Plot",
  "Office",
  "Shop",
  "Warehouse",
] as const;

export const BHK_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5] as const;

export const FURNISHINGS = ["Unfurnished", "Semi", "Furnished"] as const;
export const POSSESSIONS = ["Ready", "UnderConstruction", "NewLaunch"] as const;

export const PROPERTY_STATUSES = [
  "Available",
  "Hold",
  "UnderNegotiation",
  "Sold",
  "Rented",
  "Inactive",
] as const;

export const FOLLOWUP_TYPES = [
  "Call",
  "WhatsApp",
  "Email",
  "PropertySharing",
  "SiteVisitFollowUp",
  "Negotiation",
  "DocumentFollowUp",
  "PaymentFollowUp",
  "General",
] as const;

export const FOLLOWUP_STATUSES = ["Pending", "Completed", "Cancelled"] as const;

export const SITE_VISIT_STATUSES = [
  "Scheduled",
  "Confirmed",
  "Completed",
  "Rescheduled",
  "Cancelled",
  "NoShow",
] as const;

export const TASK_STATUSES = ["Pending", "InProgress", "Completed", "Cancelled"] as const;

// Sales pipeline — ordered, with default probability
export const PIPELINE_STAGES = [
  { key: "Qualified", label: "Qualified", probability: 15 },
  { key: "Property Shared", label: "Property Shared", probability: 25 },
  { key: "Visit Scheduled", label: "Visit Scheduled", probability: 40 },
  { key: "Visit Completed", label: "Visit Completed", probability: 55 },
  { key: "Negotiation", label: "Negotiation", probability: 70 },
  { key: "Token", label: "Token", probability: 85 },
  { key: "Booked", label: "Booked", probability: 95 },
  { key: "Closed Won", label: "Closed Won", probability: 100 },
  { key: "Closed Lost", label: "Closed Lost", probability: 0 },
] as const;

export const PIPELINE_STAGE_KEYS = PIPELINE_STAGES.map((s) => s.key);
export const OPEN_PIPELINE_STAGES = PIPELINE_STAGES.filter(
  (s) => !s.key.startsWith("Closed"),
);

export const COMMISSION_STATUSES = ["Pending", "Partial", "Received"] as const;

export const CONTACT_TYPES = [
  "Buyer",
  "Tenant",
  "Seller",
  "Landlord",
  "Owner",
  "Investor",
  "ChannelPartner",
  "Referral",
  "Other",
] as const;

export const DEFAULT_LEAD_SOURCES = [
  { name: "WhatsApp", category: "Social", sortkey: 10 },
  { name: "Instagram", category: "Social", sortkey: 20 },
  { name: "Facebook", category: "Social", sortkey: 30 },
  { name: "Website", category: "Direct", sortkey: 40 },
  { name: "Google", category: "Direct", sortkey: 50 },
  { name: "99acres", category: "Portal", sortkey: 60 },
  { name: "MagicBricks", category: "Portal", sortkey: 70 },
  { name: "Housing.com", category: "Portal", sortkey: 80 },
  { name: "NoBroker", category: "Portal", sortkey: 90 },
  { name: "OLX", category: "Portal", sortkey: 100 },
  { name: "Referral", category: "Referral", sortkey: 110 },
  { name: "Walk-in", category: "Direct", sortkey: 120 },
  { name: "Existing Client", category: "Referral", sortkey: 130 },
  { name: "Direct Call", category: "Direct", sortkey: 140 },
  { name: "Channel Partner", category: "Partner", sortkey: 150 },
  { name: "Other", category: "Other", sortkey: 999 },
];

export const ACTIVITY_TYPES = [
  "LEAD_CREATED",
  "LEAD_UPDATED",
  "STATUS_CHANGED",
  "ASSIGNED",
  "CALL",
  "WHATSAPP",
  "EMAIL",
  "NOTE",
  "PROPERTY_SHARED",
  "FOLLOWUP_CREATED",
  "FOLLOWUP_COMPLETED",
  "SITE_VISIT_SCHEDULED",
  "SITE_VISIT_COMPLETED",
  "SITE_VISIT_FEEDBACK",
  "DEAL_CREATED",
  "DEAL_STAGE_CHANGED",
  "DEAL_CLOSED",
  "COMMISSION_UPDATED",
  "TEMPERATURE_CHANGED",
] as const;

// Lead ageing buckets (days since last activity)
export const AGEING_BUCKETS = [
  { key: "today", label: "Today", min: 0, max: 0 },
  { key: "1-3", label: "1–3 days", min: 1, max: 3 },
  { key: "4-7", label: "4–7 days", min: 4, max: 7 },
  { key: "8-15", label: "8–15 days", min: 8, max: 15 },
  { key: "16-30", label: "16–30 days", min: 16, max: 30 },
  { key: "30+", label: "30+ days", min: 31, max: 99999 },
] as const;
