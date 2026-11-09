import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const BASE = "http://localhost:3000";
const ok = (m) => console.log("✓", m);
const bad = (m) => console.log("✗", m);

const db = new PrismaClient();
const TEST_EMAIL = "sameer.isolation.test@navinest.in";
const TEST_PASSWORD = "TestPass123!";

// Create a second test user with role MANAGER — the critical case, since the
// old code gave ADMIN/MANAGER unscoped visibility over every call list.
const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
const testUser = await db.user.create({
  data: {
    name: "Sameer Isolation Test",
    email: TEST_EMAIL,
    phone: "9000000000",
    passwordHash,
    role: "MANAGER",
    active: true,
    avatarColor: "#888888",
  },
});
ok(`created test user ${testUser.id} (role MANAGER)`);

async function loginAndPaste(email, password, text) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 60000 });
  await page.goto(`${BASE}/call-list`);
  await page.click('button:has-text("Paste List")');
  await page.fill('textarea[name="text"]', text);
  await page.click('button:has-text("Parse Numbers")');
  await page.waitForTimeout(1500);
  return { browser, page };
}

async function visibleNames(page) {
  await page.goto(`${BASE}/call-list?status=All`);
  await page.waitForTimeout(800);
  return page.locator("li").allTextContents();
}

const adminSession = await loginAndPaste(
  process.env.ADMIN_EMAIL || "admin@navinest.in",
  process.env.ADMIN_PASSWORD || "changeme123",
  "ADMIN ISOLATION ROW\n9111111111\nadmin's own list",
);
ok("admin pasted their own test row");

const sameerSession = await loginAndPaste(TEST_EMAIL, TEST_PASSWORD, "SAMEER ISOLATION ROW\n9222222222\nsameer's own list");
ok("manager-role test user pasted their own test row");

const adminView = await visibleNames(adminSession.page);
const adminSeesOwn = adminView.some((t) => t.includes("ADMIN ISOLATION ROW"));
const adminSeesOther = adminView.some((t) => t.includes("SAMEER ISOLATION ROW"));
adminSeesOwn ? ok("admin sees their own row") : bad("admin can't see their own row!");
!adminSeesOther ? ok("admin does NOT see the other account's row (isolation holds)") : bad("LEAK: admin can see the other account's call list row");

const sameerView = await visibleNames(sameerSession.page);
const sameerSeesOwn = sameerView.some((t) => t.includes("SAMEER ISOLATION ROW"));
const sameerSeesOther = sameerView.some((t) => t.includes("ADMIN ISOLATION ROW"));
sameerSeesOwn ? ok("test user sees their own row") : bad("test user can't see their own row!");
!sameerSeesOther ? ok("test user does NOT see admin's row (isolation holds)") : bad("LEAK: test user (role MANAGER) can see admin's call list row");

await adminSession.browser.close();
await sameerSession.browser.close();

// Cleanup — remove both test rows and the test user
const removed = await db.callListEntry.deleteMany({
  where: { OR: [{ name: "ADMIN ISOLATION ROW" }, { name: "SAMEER ISOLATION ROW" }] },
});
ok(`cleaned up ${removed.count} test call-list rows`);
await db.user.delete({ where: { id: testUser.id } });
ok("cleaned up test user");

await db.$disconnect();
console.log("\nDONE");
