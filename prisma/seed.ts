/**
 * Production seed — a CLEAN start.
 *
 * Wipes every table, then creates ONLY:
 *   • one admin user   (from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in .env)
 *   • the default lead sources (configuration, not demo data — edit in Settings)
 *
 * Run with:  npm run db:seed
 * For the full fictional demo dataset instead:  npm run db:seed:demo
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_LEAD_SOURCES } from "../src/lib/constants";

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@navinest.in").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "changeme123";
  const name = process.env.ADMIN_NAME || "NaviNest Admin";

  console.log("Clearing all data…");
  await db.$transaction([
    db.commission.deleteMany(),
    db.deal.deleteMany(),
    db.auditLog.deleteMany(),
    db.notification.deleteMany(),
    db.activity.deleteMany(),
    db.propertyInterest.deleteMany(),
    db.siteVisit.deleteMany(),
    db.followUp.deleteMany(),
    db.task.deleteMany(),
    db.lead.deleteMany(),
    db.property.deleteMany(),
    db.project.deleteMany(),
    db.owner.deleteMany(),
    db.contact.deleteMany(),
    db.channelPartner.deleteMany(),
    db.leadSource.deleteMany(),
    db.user.deleteMany(),
  ]);

  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
      avatarColor: "#0f766e",
    },
  });

  await db.leadSource.createMany({ data: DEFAULT_LEAD_SOURCES });

  console.log(`\n✔ Clean database ready.`);
  console.log(`  Admin login: ${email}  /  ${password}`);
  console.log(`  ${DEFAULT_LEAD_SOURCES.length} lead sources created.`);
  if (password === "changeme123") {
    console.log(`\n  ⚠  Set ADMIN_PASSWORD in .env and re-run, or change it in the app after logging in.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
