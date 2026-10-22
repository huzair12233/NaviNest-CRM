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

// Pick a real property
await p.goto(`${BASE}/properties`);
await p.waitForSelector("table tbody tr");
await p.locator("table tbody tr a").first().click();
await p.waitForURL(/\/properties\/[a-z0-9]{15,}$/, { timeout: 15000 });
const propUrl = p.url();
const propId = propUrl.split("/").pop();
ok(`opened property ${propId}`);

// Generic "Share on WhatsApp" button — no phone, should be wa.me/ with no number
const genericHref = await p.locator('a:has-text("Share on WhatsApp")').getAttribute("href");
console.log("  generic href prefix:", genericHref?.slice(0, 40));
genericHref?.startsWith("https://wa.me/?text=") ? ok("generic share has no recipient (opens contact picker)") : bad(`unexpected: ${genericHref}`);

const decoded = decodeURIComponent(genericHref.split("text=")[1]);
console.log("  message preview:\n" + decoded.split("\n").slice(0, 6).join("\n"));
!/\d{1,4}[-,/]\d{2,4}.*Floor \d+,/.test(decoded) ? ok("message built without crashing") : null;
decoded.includes("💰") && decoded.includes("📍") ? ok("message includes price + location") : bad("message missing expected fields");

await p.screenshot({ path: "test-artifacts/property-whatsapp.png", fullPage: true });

// Now test the lead-side matched-properties WhatsApp button (if any matches)
await p.goto(`${BASE}/leads`);
await p.waitForSelector("table tbody tr");
// find a lead with at least one matched property button
let leadUrl = null;
const leadLinks = await p.locator('table tbody tr a').evaluateAll((els) => els.map((e) => e.getAttribute("href")).filter((h) => h?.startsWith("/leads/")));
for (const href of [...new Set(leadLinks)].slice(0, 10)) {
  await p.goto(`${BASE}${href}`);
  const count = await p.locator('a:has-text("WhatsApp")').count();
  if (count > 0) {
    leadUrl = href;
    break;
  }
}

if (!leadUrl) {
  bad("no lead with a matched/shared property found to test recipient-specific share");
} else {
  ok(`found lead with WhatsApp share buttons: ${leadUrl}`);
  const waBtn = p.locator('a:has-text("WhatsApp")').first();
  const href = await waBtn.getAttribute("href");
  console.log("  lead-context wa href prefix:", href?.slice(0, 40));
  /https:\/\/wa\.me\/91\d{10}\?text=/.test(href || "") ? ok("recipient number correctly embedded") : bad(`unexpected href: ${href}`);

  const [popup] = await Promise.all([
    b.contexts()[0].waitForEvent("page").catch(() => null),
    waBtn.click(),
  ]);
  if (popup) await popup.close().catch(() => {});
  await p.waitForTimeout(1500);

  const sharedBadge = await p.locator("text=Shared").count();
  sharedBadge > 0 ? ok("share action logged (Shared badge / activity present)") : bad("no Shared indicator found after click");
}

await b.close();
console.log("\nDONE", JSON.stringify({ propId, leadUrl }));
