import { z } from "zod";
import { isValidPhone } from "./utils";
import {
  LEAD_TYPES,
  INTERESTS,
  PROPERTY_LISTING_TYPES,
  LEAD_STATUSES,
  TEMPERATURES,
  PRIORITIES,
  PROPERTY_TYPES,
  FURNISHINGS,
  POSSESSIONS,
  PROPERTY_STATUSES,
  FOLLOWUP_TYPES,
  FOLLOWUP_STATUSES,
  SITE_VISIT_STATUSES,
  TASK_STATUSES,
  PIPELINE_STAGE_KEYS,
  COMMISSION_STATUSES,
  CONTACT_TYPES,
  ROLES,
} from "./constants";

const phone = z
  .string()
  .trim()
  .refine((v) => isValidPhone(v), "Enter a valid 10-digit Indian mobile number");
const optPhone = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || isValidPhone(v), "Invalid mobile number");
const optEmail = z.string().trim().email("Invalid email").optional().or(z.literal(""));
const blank = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);
const num = z.preprocess(blank, z.coerce.number().nonnegative().optional());
const int = z.preprocess(blank, z.coerce.number().int().nonnegative().optional());
const bool = z
  .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true");
const date = z.preprocess(blank, z.coerce.date().optional());
const list = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

export const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  phone,
  altPhone: optPhone,
  whatsapp: optPhone,
  email: optEmail,
  leadType: z.enum(LEAD_TYPES),
  interest: z.enum(INTERESTS),
  status: z.enum(LEAD_STATUSES).optional(),
  temperature: z.enum(TEMPERATURES),
  priority: z.enum(PRIORITIES),
  sourceId: z.string().optional(),
  channelPartnerId: z.string().optional(),
  assignedToId: z.string().optional(),
  propertyType: z.string().optional(),
  bhk: num,
  locations: list,
  preferredProject: z.string().trim().optional(),
  budgetMin: int,
  budgetMax: int,
  areaMin: int,
  areaMax: int,
  rentMin: int,
  rentMax: int,
  depositMax: int,
  furnishing: z.string().optional(),
  parkingReq: bool,
  floorPref: z.string().optional(),
  possessionReq: z.string().optional(),
  moveInDate: date,
  loanRequired: bool,
  occupancy: z.string().optional(),
  requirementNotes: z.string().trim().optional(),
});

export const leadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  note: z.string().trim().optional(),
  lostReason: z.string().trim().optional(),
});

export const noteSchema = z.object({
  leadId: z.string().min(1),
  type: z.enum(["NOTE", "CALL", "WHATSAPP", "EMAIL"]),
  summary: z.string().trim().min(1, "Write something"),
});

export const followUpSchema = z.object({
  leadId: z.string().min(1),
  assignedToId: z.string().optional(),
  dueAt: z.coerce.date(),
  type: z.enum(FOLLOWUP_TYPES),
  purpose: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  priority: z.enum(PRIORITIES).default("Normal"),
});

export const followUpCompleteSchema = z.object({
  outcome: z.string().trim().min(1, "Record the outcome"),
  status: z.enum(FOLLOWUP_STATUSES).default("Completed"),
  nextFollowUpAt: date,
  nextType: z.enum(FOLLOWUP_TYPES).optional(),
});

export const siteVisitSchema = z.object({
  leadId: z.string().min(1),
  propertyId: z.string().optional(),
  assignedToId: z.string().optional(),
  scheduledAt: z.coerce.date(),
  location: z.string().trim().optional(),
  status: z.enum(SITE_VISIT_STATUSES).default("Scheduled"),
});

export const siteVisitFeedbackSchema = z.object({
  status: z.enum(SITE_VISIT_STATUSES),
  interested: z.preprocess(blank, z.enum(["Yes", "Maybe", "No"]).optional()),
  rating: z.preprocess(blank, z.coerce.number().int().min(1).max(5).optional()),
  liked: z.string().trim().optional(),
  disliked: z.string().trim().optional(),
  objections: z.string().trim().optional(),
  priceFeedback: z.string().trim().optional(),
  competitor: z.string().trim().optional(),
  nextAction: z.string().trim().optional(),
  nextFollowUpAt: date,
});

export const propertySchema = z.object({
  title: z.string().trim().min(3, "Title is required"),
  listingType: z.enum(PROPERTY_LISTING_TYPES),
  segment: z.enum(["Residential", "Commercial"]),
  propertyType: z.enum(PROPERTY_TYPES),
  bhk: num,
  projectName: z.string().trim().optional(),
  location: z.string().trim().min(2, "Location is required"),
  address: z.string().trim().optional(),
  city: z.string().trim().default("Navi Mumbai"),
  carpetArea: int,
  builtupArea: int,
  floor: int,
  totalFloors: int,
  furnishing: z.enum(FURNISHINGS),
  parking: z.coerce.number().int().min(0).default(0),
  bathrooms: int,
  balcony: int,
  ageYears: int,
  possession: z.enum(POSSESSIONS),
  salePrice: int,
  rent: int,
  deposit: int,
  maintenance: int,
  ownerId: z.string().optional(),
  listingSource: z.string().trim().default("Direct"),
  status: z.enum(PROPERTY_STATUSES).default("Available"),
  description: z.string().trim().optional(),
  amenities: list,
});

export const ownerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone,
  whatsapp: optPhone,
  email: optEmail,
  preferredContact: z.enum(["Call", "WhatsApp", "Email"]).default("Call"),
  relationshipStatus: z.enum(["Active", "Cold", "VIP", "DoNotContact"]).default("Active"),
  notes: z.string().trim().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone,
  altPhone: optPhone,
  whatsapp: optPhone,
  email: optEmail,
  type: z.enum(CONTACT_TYPES),
  notes: z.string().trim().optional(),
});

export const dealSchema = z.object({
  title: z.string().trim().min(3, "Title is required"),
  leadId: z.string().optional(),
  propertyId: z.string().optional(),
  contactId: z.string().optional(),
  ownerId: z.string().optional(),
  type: z.enum(["SALE", "RENT"]),
  value: z.coerce.number().int().nonnegative().default(0),
  stage: z.enum(PIPELINE_STAGE_KEYS as [string, ...string[]]).default("Qualified"),
  probability: z.preprocess(blank, z.coerce.number().int().min(0).max(100).optional()),
  expectedCloseDate: date,
  assignedToId: z.string().optional(),
  notes: z.string().trim().optional(),
});

export const dealStageSchema = z.object({
  stage: z.enum(PIPELINE_STAGE_KEYS as [string, ...string[]]),
  lostReason: z.string().trim().optional(),
});

export const commissionSchema = z.object({
  dealValue: z.coerce.number().int().nonnegative(),
  percentage: z.coerce.number().min(0).max(100),
  receivedAmount: z.coerce.number().int().nonnegative().default(0),
  paymentDate: date,
  employeeSharePct: z.coerce.number().min(0).max(100).default(30),
  status: z.enum(COMMISSION_STATUSES).default("Pending"),
  notes: z.string().trim().optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Task title is required"),
  assignedToId: z.string().optional(),
  dueAt: date,
  priority: z.enum(PRIORITIES).default("Normal"),
  status: z.enum(TASK_STATUSES).default("Pending"),
  leadId: z.string().optional(),
  propertyId: z.string().optional(),
  notes: z.string().trim().optional(),
});

export const userSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: optPhone,
  role: z.enum(ROLES),
  password: z.preprocess(blank, z.string().min(6, "Min 6 characters").optional()),
  active: bool,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;

export function flattenErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
