/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_LEAD_SOURCES,
  LEAD_STATUSES,
  TEMPERATURES,
  PRIORITIES,
  PROPERTY_TYPES,
  FURNISHINGS,
  FOLLOWUP_TYPES,
  PIPELINE_STAGES,
} from "../src/lib/constants";

const db = new PrismaClient();

// ── deterministic RNG so re-seeds are reproducible ──────────────────────────
let s = 20260827;
const rnd = () => {
  s = (s * 1664525 + 1013904223) % 4294967296;
  return s / 4294967296;
};
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const chance = (p: number) => rnd() < p;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
const daysAhead = (d: number) => new Date(Date.now() + d * 86400000);
const atHour = (date: Date, h: number) => {
  const x = new Date(date);
  x.setHours(h, pick([0, 15, 30, 45]), 0, 0);
  return x;
};

const LOCATIONS = [
  "Kharghar", "Panvel", "New Panvel", "Taloja Phase 1", "Taloja Phase 2", "Ulwe",
  "Kamothe", "Kalamboli", "Airoli", "Ghansoli", "Vashi", "Nerul", "Seawoods", "CBD Belapur",
];
const PROJECTS = [
  { name: "Paradise Sai World", location: "Kharghar" },
  { name: "Bhagwati Greens", location: "Kharghar" },
  { name: "Marathon Nexzone", location: "Panvel" },
  { name: "Wadhwa Wise City", location: "New Panvel" },
  { name: "Regency Anantam", location: "Taloja Phase 2" },
  { name: "Arihant Aspire", location: "Panvel" },
  { name: "Sai Proviso Wave", location: "Ulwe" },
  { name: "Neelkanth Woods", location: "Kamothe" },
  { name: "Haware Citi", location: "Kalamboli" },
  { name: "Paradise Sai Crystals", location: "Airoli" },
  { name: "Hiranandani Estate", location: "Seawoods" },
  { name: "Rustomjee Seasons", location: "Nerul" },
];
const FIRST = ["Aarav","Vivaan","Aditya","Rohan","Kabir","Ishaan","Rahul","Sameer","Nikhil","Farhan","Imran","Zaid","Priya","Neha","Sneha","Ananya","Divya","Pooja","Fatima","Ayesha","Sanjay","Deepak","Manish","Vikram","Suresh","Anil","Karan","Meera","Kavita","Rekha"];
const LAST = ["Sharma","Verma","Patil","Deshmukh","Joshi","Nair","Menon","Iyer","Shaikh","Khan","Ansari","Gupta","Agarwal","Reddy","Rao","Kulkarni","Jadhav","More","Naik","Pawar","Singh","Bhosale","Mehta","Shah"];
const name = () => `${pick(FIRST)} ${pick(LAST)}`;
const phone = () => `9${int(100000000, 999999999)}`;

async function main() {
  console.log("Clearing existing data…");
  await db.$transaction([
    db.commission.deleteMany(), db.deal.deleteMany(), db.auditLog.deleteMany(),
    db.notification.deleteMany(), db.activity.deleteMany(), db.propertyInterest.deleteMany(),
    db.siteVisit.deleteMany(), db.followUp.deleteMany(), db.task.deleteMany(),
    db.lead.deleteMany(), db.property.deleteMany(), db.project.deleteMany(),
    db.owner.deleteMany(), db.contact.deleteMany(), db.channelPartner.deleteMany(),
    db.leadSource.deleteMany(), db.user.deleteMany(),
  ]);

  const pw = await bcrypt.hash("navinest", 10);
  const users = await Promise.all([
    db.user.create({ data: { name: "Anil Kapoor", email: "admin@navinest.in", passwordHash: pw, role: "ADMIN", phone: phone(), avatarColor: "#0f766e" } }),
    db.user.create({ data: { name: "Priya Nair", email: "priya@navinest.in", passwordHash: pw, role: "MANAGER", phone: phone(), avatarColor: "#7c3aed" } }),
    db.user.create({ data: { name: "Rahul Verma", email: "rahul@navinest.in", passwordHash: pw, role: "SALES", phone: phone(), avatarColor: "#2563eb" } }),
    db.user.create({ data: { name: "Sneha Patil", email: "sneha@navinest.in", passwordHash: pw, role: "SALES", phone: phone(), avatarColor: "#db2777" } }),
    db.user.create({ data: { name: "Imran Shaikh", email: "imran@navinest.in", passwordHash: pw, role: "SALES", phone: phone(), avatarColor: "#ea580c" } }),
  ]);
  const sales = users.slice(2);
  // everyone carries leads for the demo (sales weighted heavier); RBAC still scopes views
  const owners_pool = [...sales, ...sales, ...sales, users[0], users[1], users[1]];

  const sources = await Promise.all(
    DEFAULT_LEAD_SOURCES.map((src) => db.leadSource.create({ data: src })),
  );

  const projects = await Promise.all(
    PROJECTS.map((p) =>
      db.project.create({
        data: { name: p.name, location: p.location, type: chance(0.15) ? "Commercial" : "Residential", developer: p.name.split(" ")[0] },
      }),
    ),
  );

  const owners = await Promise.all(
    Array.from({ length: 18 }).map(() => {
      const n = name();
      return db.owner.create({
        data: {
          name: n, phone: phone(), whatsapp: chance(0.7) ? phone() : null,
          email: chance(0.5) ? `${n.split(" ")[0].toLowerCase()}@gmail.com` : null,
          preferredContact: pick(["Call", "WhatsApp", "Email"]),
          relationshipStatus: pick(["Active", "Active", "Active", "VIP", "Cold"]),
          lastContactedAt: chance(0.7) ? daysAgo(int(1, 40)) : null,
          createdById: pick(users).id,
        },
      });
    }),
  );

  const partners = await Promise.all(
    ["Skyline Associates", "GreenAcreRealty", "MetroKey Advisors"].map((c) =>
      db.channelPartner.create({
        data: { name: name(), company: c, phone: phone(), reraId: `A5170000${int(10000, 99999)}`, createdById: users[1].id },
      }),
    ),
  );

  // ── Properties ──────────────────────────────────────────────────────────
  const AMENITIES = ["Lift", "Power Backup", "Gym", "Swimming Pool", "Clubhouse", "Kids Play Area", "24x7 Security", "Covered Parking", "Landscaped Garden", "Jogging Track"];
  const properties = await Promise.all(
    Array.from({ length: 38 }).map((_, i) => {
      const listingType = chance(0.62) ? "SALE" : "RENT";
      const proj = pick(projects);
      const bhk = pick([1, 1, 2, 2, 2, 3, 3, 4]);
      const carpet = bhk * int(320, 430);
      const segment = proj.type === "Commercial" ? "Commercial" : "Residential";
      const ptype = segment === "Commercial" ? pick(["Office", "Shop"] as const) : pick(["Apartment", "Apartment", "Apartment", "Villa", "RowHouse"] as const);
      const salePrice = listingType === "SALE" ? bhk * int(3200000, 4200000) + int(-300000, 500000) : null;
      const rent = listingType === "RENT" ? bhk * int(8000, 13000) : null;
      const status =
        chance(0.68) ? "Available" : pick(["Hold", "UnderNegotiation", "Sold", "Rented", "Inactive"]);
      return db.property.create({
        data: {
          code: `NN-P${String(i + 1).padStart(4, "0")}`,
          title: `${bhk} BHK ${ptype} in ${proj.name}`,
          listingType, segment, propertyType: ptype, bhk,
          projectId: proj.id, location: proj.location, city: "Navi Mumbai",
          address: `${pick(["A", "B", "C", "D"])}-${int(101, 2304)}, ${proj.name}`,
          carpetArea: carpet, builtupArea: Math.round(carpet * 1.4),
          floor: int(1, 22), totalFloors: int(22, 40),
          furnishing: pick(FURNISHINGS), parking: pick([0, 1, 1, 2]),
          bathrooms: Math.max(1, bhk - 1), balcony: pick([1, 1, 2]),
          ageYears: int(0, 12), possession: pick(["Ready", "Ready", "Ready", "UnderConstruction"]),
          salePrice, rent, deposit: rent ? rent * int(2, 6) : null,
          maintenance: int(1500, 4500),
          ownerId: pick(owners).id, addedById: pick(users).id,
          listingSource: pick(["Direct", "99acres", "Owner Referral", "MagicBricks"]),
          status,
          description: "Well-ventilated home with good natural light, close to station and schools. Ready to move.",
          amenities: [...AMENITIES].sort(() => rnd() - 0.5).slice(0, int(4, 8)).join(", "),
        },
      });
    }),
  );

  // ── Leads ───────────────────────────────────────────────────────────────
  const openStatuses = LEAD_STATUSES.filter((x) => !["Converted", "Lost", "Not Interested"].includes(x));
  const leads = [];
  for (let i = 0; i < 64; i++) {
    const interest = pick(["SALE", "SALE", "SALE", "RENT", "RENT", "BOTH"] as const);
    const createdAt = daysAgo(int(0, 95));
    const status =
      chance(0.12) ? "Converted" : chance(0.1) ? pick(["Lost", "Not Interested"]) : pick(openStatuses as string[]);
    const bhk = pick([1, 2, 2, 3, 3]);
    const budgetBase = bhk * int(3000000, 4000000);
    const assigned = pick(owners_pool);
    const nm = name();
    const isRent = interest === "RENT";
    const lead = await db.lead.create({
      data: {
        code: `NN-L${String(i + 1).padStart(4, "0")}`,
        fullName: nm, phone: phone(),
        whatsapp: chance(0.8) ? phone() : null,
        email: chance(0.55) ? `${nm.split(" ")[0].toLowerCase()}${int(1, 99)}@gmail.com` : null,
        leadType: isRent ? "Tenant" : pick(["Buyer", "Buyer", "Investor"]),
        interest,
        status,
        temperature: status === "Converted" ? "Hot" : pick(TEMPERATURES),
        priority: pick(PRIORITIES),
        propertyType: pick(PROPERTY_TYPES.slice(0, 3)),
        bhk,
        locations: [...LOCATIONS].sort(() => rnd() - 0.5).slice(0, int(1, 3)).join(", "),
        preferredProject: chance(0.4) ? pick(PROJECTS).name : null,
        budgetMin: isRent ? null : budgetBase - 500000,
        budgetMax: isRent ? null : budgetBase + 700000,
        rentMin: isRent ? bhk * 8000 : null,
        rentMax: isRent ? bhk * 13000 : null,
        depositMax: isRent ? bhk * 60000 : null,
        areaMin: bhk * 300, areaMax: bhk * 480,
        furnishing: pick(["Any", ...FURNISHINGS]),
        parkingReq: chance(0.6),
        loanRequired: !isRent && chance(0.55),
        occupancy: pick(["Family", "Family", "Bachelor", "Company"]),
        possessionReq: pick(["Ready", "Ready", "Any"]),
        requirementNotes: chance(0.4) ? "Prefers higher floor, east-facing. Flexible on possession." : null,
        sourceId: pick(sources).id,
        channelPartnerId: chance(0.12) ? pick(partners).id : null,
        assignedToId: assigned.id,
        createdById: pick(users).id,
        createdAt,
        lastActivityAt: createdAt,
        lostReason: status === "Lost" ? pick(["Budget mismatch", "Bought elsewhere", "Postponed plan", "Unresponsive"]) : null,
      },
    });
    leads.push(lead);

    await db.activity.create({
      data: { type: "LEAD_CREATED", summary: `Lead created from ${sources.find((x) => x.id === lead.sourceId)?.name}`, leadId: lead.id, userId: lead.createdById, createdAt },
    });

    // Follow-ups
    const fuCount = int(0, 4);
    let lastActivity = createdAt;
    for (let f = 0; f < fuCount; f++) {
      const done = f < fuCount - 1 || chance(0.5);
      const base = done ? daysAgo(int(1, 30)) : pick([daysAgo(int(1, 6)), new Date(), daysAhead(int(1, 8))]);
      const fu = await db.followUp.create({
        data: {
          leadId: lead.id, assignedToId: assigned.id,
          dueAt: atHour(base, int(10, 18)),
          type: pick(FOLLOWUP_TYPES), purpose: pick(["Discuss requirement", "Share options", "Site visit planning", "Price negotiation", "Documentation"]),
          priority: pick(PRIORITIES),
          status: done ? "Completed" : "Pending",
          outcome: done ? pick(["Spoke, still deciding", "Asked to call next week", "Interested, wants a visit", "Not reachable", "Shared 3 options on WhatsApp"]) : null,
          completedAt: done ? base : null,
          createdById: assigned.id, createdAt: base,
        },
      });
      if (done) {
        lastActivity = base > lastActivity ? base : lastActivity;
        await db.activity.create({ data: { type: "FOLLOWUP_COMPLETED", summary: `Follow-up (${fu.type}) completed — ${fu.outcome}`, leadId: lead.id, userId: assigned.id, createdAt: base } });
      }
    }

    // Property shares + interests
    if (["Property Shared", "Follow-up", "Site Visit Scheduled", "Site Visit Completed", "Negotiation", "Token / Booking", "Converted"].includes(status)) {
      const shareable = properties.filter((p) => p.listingType === (isRent ? "RENT" : "SALE")).sort(() => rnd() - 0.5).slice(0, int(1, 3));
      for (const p of shareable) {
        await db.propertyInterest.create({
          data: { leadId: lead.id, propertyId: p.id, status: pick(["SHARED", "SHARED", "INTERESTED", "REJECTED"]), matchScore: int(55, 95), sharedAt: daysAgo(int(1, 25)) },
        });
      }
    }

    // Site visits
    if (["Site Visit Scheduled", "Site Visit Completed", "Negotiation", "Token / Booking", "Converted"].includes(status)) {
      const p = pick(properties.filter((x) => x.listingType === (isRent ? "RENT" : "SALE")));
      const completed = status !== "Site Visit Scheduled";
      const when = completed ? daysAgo(int(1, 20)) : daysAhead(int(0, 6));
      await db.siteVisit.create({
        data: {
          leadId: lead.id, propertyId: p?.id, assignedToId: assigned.id,
          scheduledAt: atHour(when, int(11, 18)),
          location: p?.location, status: completed ? "Completed" : pick(["Scheduled", "Confirmed"]),
          interested: completed ? pick(["Yes", "Yes", "Maybe", "No"]) : null,
          rating: completed ? int(2, 5) : null,
          liked: completed ? pick(["Layout and ventilation", "Location and connectivity", "Amenities", "Carpet area"]) : null,
          disliked: completed ? pick(["Parking is tight", "Needs renovation", "Road-facing noise", "Price on higher side"]) : null,
          priceFeedback: completed ? pick(["Expects 5% lower", "Okay with price", "Wants furniture included"]) : null,
          nextAction: completed ? pick(["Second visit with family", "Send final quote", "Follow up in 3 days"]) : null,
          feedbackAt: completed ? when : null,
          createdById: assigned.id, createdAt: daysAgo(int(5, 25)),
        },
      });
      if (completed) await db.activity.create({ data: { type: "SITE_VISIT_COMPLETED", summary: `Site visit completed at ${p?.location}`, leadId: lead.id, userId: assigned.id, createdAt: when } });
    }

    await db.lead.update({ where: { id: lead.id }, data: { lastActivityAt: lastActivity } });
  }

  // ── Deals + commissions ─────────────────────────────────────────────────
  const dealLeads = leads.filter((l) =>
    ["Property Shared", "Follow-up", "Site Visit Scheduled", "Site Visit Completed", "Negotiation", "Token / Booking", "Converted"].includes(l.status),
  );
  const STAGE_BY_STATUS: Record<string, string> = {
    "Property Shared": "Property Shared",
    "Follow-up": "Qualified",
    "Site Visit Scheduled": "Visit Scheduled",
    "Site Visit Completed": "Visit Completed",
    Negotiation: "Negotiation",
  };
  let dealNo = 0;
  for (const l of dealLeads) {
    dealNo++;
    const won = l.status === "Converted";
    const stage = won
      ? "Closed Won"
      : l.status === "Token / Booking"
        ? pick(["Token", "Booked"])
        : STAGE_BY_STATUS[l.status] ?? "Qualified";
    const stageDef = PIPELINE_STAGES.find((x) => x.key === stage)!;
    const isRent = l.interest === "RENT";
    const prop = pick(properties.filter((p) => p.listingType === (isRent ? "RENT" : "SALE")));
    const value = isRent ? (prop?.rent ?? 25000) * 12 : prop?.salePrice ?? 5000000;
    const closedAt = won ? daysAgo(int(1, 60)) : null;
    const deal = await db.deal.create({
      data: {
        code: `NN-D${String(dealNo).padStart(4, "0")}`,
        title: `${l.fullName} · ${prop?.title ?? "Requirement"}`,
        leadId: l.id, propertyId: prop?.id, ownerId: prop?.ownerId,
        channelPartnerId: l.channelPartnerId,
        type: isRent ? "RENT" : "SALE", value,
        stage, probability: stageDef.probability,
        expectedCloseDate: won ? closedAt : daysAhead(int(5, 45)),
        assignedToId: l.assignedToId, closedAt,
        notes: "Buyer keen, working through final pricing and paperwork.",
        createdAt: daysAgo(int(20, 75)),
      },
    });
    await db.activity.create({ data: { type: "DEAL_CREATED", summary: `Deal ${deal.code} created (${stage})`, leadId: l.id, dealId: deal.id, userId: l.assignedToId, createdAt: deal.createdAt } });

    if (won) {
      const pct = isRent ? int(50, 100) / 100 : int(75, 150) / 100;
      const expected = Math.round((value * pct) / 100);
      const received = chance(0.55) ? expected : chance(0.6) ? Math.round(expected * pick([0.3, 0.5])) : 0;
      await db.commission.create({
        data: {
          dealId: deal.id, dealValue: value, percentage: pct,
          expectedAmount: expected, receivedAmount: received,
          paymentDate: received > 0 ? daysAgo(int(1, 30)) : null,
          employeeSharePct: 30, companySharePct: 70,
          status: received === 0 ? "Pending" : received < expected ? "Partial" : "Received",
        },
      });
      await db.activity.create({ data: { type: "DEAL_CLOSED", summary: `Deal ${deal.code} closed — ${isRent ? "rental" : "sale"} finalised`, leadId: l.id, dealId: deal.id, userId: l.assignedToId, createdAt: closedAt! } });
    }
  }

  // ── Contacts (one per person: leads + owners + a few standalone) ─────────
  const seenPhones = new Set<string>();
  for (const l of leads) {
    if (seenPhones.has(l.phone)) continue;
    seenPhones.add(l.phone);
    await db.contact.create({
      data: {
        name: l.fullName, phone: l.phone, whatsapp: l.whatsapp, email: l.email,
        type: l.leadType === "Tenant" ? "Tenant" : l.leadType === "Investor" ? "Investor" : "Buyer",
        createdById: l.createdById,
      },
    });
  }
  for (const o of owners) {
    if (seenPhones.has(o.phone)) continue;
    seenPhones.add(o.phone);
    await db.contact.create({
      data: { name: o.name, phone: o.phone, whatsapp: o.whatsapp, email: o.email, type: "Owner", createdById: o.createdById },
    });
  }
  for (const p of partners) {
    if (seenPhones.has(p.phone)) continue;
    seenPhones.add(p.phone);
    await db.contact.create({ data: { name: p.name, phone: p.phone, type: "ChannelPartner", createdById: p.createdById } });
  }

  // ── Tasks + notifications ───────────────────────────────────────────────
  for (let i = 0; i < 14; i++) {
    const l = pick(leads);
    await db.task.create({
      data: {
        title: pick(["Collect KYC documents", "Prepare comparison sheet", "Confirm site visit slot", "Send agreement draft", "Call owner for price", "Update requirement"]),
        assignedToId: pick(sales).id, dueAt: pick([daysAgo(int(1, 4)), new Date(), daysAhead(int(1, 6))]),
        priority: pick(PRIORITIES), status: pick(["Pending", "Pending", "InProgress", "Completed"]),
        leadId: l.id, createdById: users[1].id,
      },
    });
  }
  for (const u of sales) {
    await db.notification.create({ data: { userId: u.id, type: "FOLLOWUP_DUE", title: "You have follow-ups due today", link: "/follow-ups?tab=today" } });
    await db.notification.create({ data: { userId: u.id, type: "LEAD_ASSIGNED", title: "3 new leads assigned to you this week", link: "/leads" } });
  }

  const counts = {
    users: users.length, sources: sources.length, projects: projects.length,
    owners: owners.length, properties: properties.length, leads: leads.length,
    deals: await db.deal.count(), commissions: await db.commission.count(),
    followUps: await db.followUp.count(), siteVisits: await db.siteVisit.count(),
    contacts: await db.contact.count(), tasks: await db.task.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
