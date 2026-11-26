import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const BASE = "http://localhost:3000";
const ok = (m) => console.log("✓", m);
const bad = (m) => console.log("✗", m);

const db = new PrismaClient();
const PW = "TestPass123!";
const testUser = await db.user.create({
  data: { name: "Sort Test", email: "sort.test@navinest.in", passwordHash: await bcrypt.hash(PW, 10), role: "SALES", avatarColor: "#888" },
});
ok(`created test user ${testUser.id}`);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });

await p.goto(`${BASE}/login`);
await p.fill('input[name="email"]', "sort.test@navinest.in");
await p.fill('input[name="password"]', PW);
await p.click('button[type="submit"]');
await p.waitForURL("**/dashboard", { timeout: 60000 });

await p.goto(`${BASE}/call-list`);
await p.click('button:has-text("Paste List")');
await p.fill('textarea[name="text"]', "SORT ROW ONE\n9444444441\nfirst\nSORT ROW TWO\n9444444442\nsecond");
await p.click('button:has-text("Parse Numbers")');
await p.waitForTimeout(1200);
ok("pasted two rows");

// Mark ROW ONE called first
await p.locator('li:has-text("SORT ROW ONE")').first().getByTitle("Mark called").click();
await p.waitForSelector("text=Call outcome", { timeout: 5000 });
await p.locator('button:has-text("Interested")').first().click();
await p.waitForTimeout(1500);
ok("marked ROW ONE called");

// Then mark ROW TWO called, a couple seconds later
await p.goto(`${BASE}/call-list`);
await p.locator('li:has-text("SORT ROW TWO")').first().getByTitle("Mark called").click();
await p.waitForSelector("text=Call outcome", { timeout: 5000 });
await p.locator('button:has-text("Ringing")').first().click();
await p.waitForTimeout(1500);
ok("marked ROW TWO called (later)");

await p.goto(`${BASE}/call-list?status=Called`);
await p.waitForTimeout(800);
const items = await p.locator("li").allTextContents();
const idxOne = items.findIndex((t) => t.includes("SORT ROW ONE"));
const idxTwo = items.findIndex((t) => t.includes("SORT ROW TWO"));
console.log(`index of ROW ONE (called earlier): ${idxOne}, index of ROW TWO (called later): ${idxTwo}`);
idxTwo < idxOne ? ok("most-recently-called row (TWO) appears ABOVE the earlier one (ONE)") : bad("sort order wrong: expected TWO above ONE");

await b.close();

const removed = await db.callListEntry.deleteMany({ where: { OR: [{ name: "SORT ROW ONE" }, { name: "SORT ROW TWO" }] } });
ok(`cleaned up ${removed.count} test rows`);
await db.user.delete({ where: { id: testUser.id } });
ok("cleaned up test user");
await db.$disconnect();
console.log("\nDONE");
