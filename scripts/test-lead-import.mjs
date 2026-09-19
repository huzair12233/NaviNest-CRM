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

await p.goto(`${BASE}/leads/import`);
await p.setInputFiles('input[type="file"]', "test-artifacts/lead-import-test.xlsx");
await p.waitForSelector("text=Detected columns", { timeout: 15000 });
ok("file parsed, preview shown");

const readyCount = await p.locator("text=/\\d+ ready/").textContent();
const dupeCount = await p.locator("text=/\\d+ duplicate/").textContent();
const invalidCount = await p.locator("text=/\\d+ invalid/").textContent();
console.log("  counts:", readyCount, dupeCount, invalidCount);
readyCount.includes("1") ? ok("1 ready row detected") : bad(`expected 1 ready, got ${readyCount}`);
dupeCount.includes("1") ? ok("1 duplicate row detected") : bad(`expected 1 duplicate, got ${dupeCount}`);
invalidCount.includes("1") ? ok("1 invalid row detected") : bad(`expected 1 invalid, got ${invalidCount}`);

await p.screenshot({ path: "test-artifacts/import-preview.png", fullPage: true });

await p.click('button:has-text("Import 1 leads")');
await p.waitForSelector("text=Import complete", { timeout: 15000 });
ok("import completed");

const summaryText = await p.locator("body").innerText();
console.log("  summary snippet:", summaryText.match(/\d+ created[\s\S]{0,60}/)?.[0]);

await p.screenshot({ path: "test-artifacts/import-done.png", fullPage: true });
await b.close();
console.log("DONE");
