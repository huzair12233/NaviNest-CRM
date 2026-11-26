import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const ok = (m) => console.log("✓", m);
const bad = (m) => console.log("✗", m);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await p.goto(`${BASE}/login`);
await p.fill('input[name="email"]', process.env.ADMIN_EMAIL || "admin@navinest.in");
await p.fill('input[name="password"]', process.env.ADMIN_PASSWORD || "changeme123");
await p.click('button[type="submit"]');
await p.waitForURL("**/dashboard", { timeout: 60000 });
ok("logged in");

await p.goto(`${BASE}/team`);
await p.waitForSelector("text=Leads Added", { timeout: 15000 });
ok("Team page shows 'Leads Added' column");

const rowTexts = await p.locator("table tbody tr").allTextContents();
const hasZuhair = rowTexts.some((t) => t.includes("Zuhair") && t.includes("zuhair@navinest.in"));
const hasRizwan = rowTexts.some((t) => t.includes("Rizwan") && t.includes("rizwan@navinest.in"));
const hasSameer = rowTexts.some((t) => t.includes("Sameer"));
hasZuhair ? ok("Zuhair account listed") : bad("Zuhair not found in team list");
hasRizwan ? ok("Rizwan account listed") : bad("Rizwan not found in team list");
hasSameer ? ok("Sameer account listed") : bad("Sameer not found in team list");

// Click Sameer's "Leads Added" count link (should be 3) and confirm it filters
const sameerRow = p.locator("table tbody tr", { hasText: "Sameer" }).first();
const leadsAddedLink = sameerRow.locator("a").first();
const linkCount = await leadsAddedLink.count();
if (linkCount > 0) {
  const href = await leadsAddedLink.getAttribute("href");
  href?.includes("/leads?createdById=") ? ok(`Sameer's Leads Added links to filtered view: ${href}`) : bad(`unexpected href: ${href}`);
  await leadsAddedLink.click();
  await p.waitForURL(/\/leads\?createdById=/, { timeout: 10000 });
  await p.waitForTimeout(800);
  const leadRows = await p.locator("table tbody tr").count();
  ok(`filtered leads view loaded with ${leadRows} row(s)`);
} else {
  bad("Sameer has no clickable Leads Added link (count may be 0)");
}

await p.screenshot({ path: "test-artifacts/team-page.png", fullPage: true });
await b.close();
console.log("\nDONE");
