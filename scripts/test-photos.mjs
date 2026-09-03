import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
p.on("response", (r) => {
  if (r.url().includes("/api/cloudinary") || r.url().includes("cloudinary.com")) console.log("HTTP", r.status(), r.url().slice(0, 70));
});

await p.goto(`${BASE}/login`);
await p.fill('input[name="email"]', process.env.ADMIN_EMAIL || "admin@navinest.in");
await p.fill('input[name="password"]', process.env.ADMIN_PASSWORD || "changeme123");
await p.click('button[type="submit"]');
await p.waitForURL("**/dashboard", { timeout: 20000 });
console.log("✓ logged in");

await p.goto(`${BASE}/properties`);
await p.waitForSelector("table");
await p.locator("table tbody tr a").first().click();
await p.waitForURL(/\/properties\/[a-z0-9]{15,}$/, { timeout: 15000 });
const url = p.url();
console.log("✓ property:", url.replace(BASE, ""));

const before = await p.locator("text=/Photos \\(/").first().textContent();
console.log("  before:", before?.trim());

await p.setInputFiles('input[type="file"]', "test-artifacts/test-photo.png");
await p.waitForSelector("text=/photo(s)? added/i", { timeout: 30000 });
await p.waitForFunction(() => /Photos \(1\)/.test(document.body.innerText), { timeout: 15000 });
console.log("✓ after upload: Photos (1)");
await p.waitForSelector('img[src*="res.cloudinary.com"]', { timeout: 15000 });
console.log("✓ cloudinary <img> rendered");

// remove it (also deletes from Cloudinary)
await p.locator('button[title="Remove"]').first().click({ force: true });
await p.waitForSelector("text=/Photo removed/i", { timeout: 15000 });
await p.waitForFunction(() => /Photos \(0\)/.test(document.body.innerText), { timeout: 15000 });
console.log("✓ after remove: Photos (0)");

await p.screenshot({ path: "test-artifacts/photos-test.png", fullPage: true });
await b.close();
console.log("\nDONE");
