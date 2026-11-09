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

await p.goto(`${BASE}/call-list`);
await p.click('button:has-text("Paste List")');
await p.fill('textarea[name="text"]', "OUTCOME TEST ROW\n9988776655\nTest remark");
await p.click('button:has-text("Parse Numbers")');
await p.waitForSelector("text=OUTCOME TEST ROW", { timeout: 15000 });
ok("row parsed and listed");

const row = p.locator('li:has-text("OUTCOME TEST ROW")').first();
await row.getByTitle("Mark called").click();
await p.waitForSelector("text=Call outcome", { timeout: 5000 });
ok("outcome popover opened");

// Preset chip
await p.locator('button:has-text("Interested")').first().click();
await p.waitForTimeout(1200);

await p.goto(`${BASE}/call-list?status=Called`);
const calledRow = p.locator('li:has-text("OUTCOME TEST ROW")').first();
const calledVisible = (await calledRow.count()) > 0;
calledVisible ? ok("row moved to Called tab") : bad("row not found in Called tab");
const remarkText = await calledRow.locator("p").first().textContent().catch(() => null);
remarkText?.includes("Interested") ? ok(`remark saved correctly: "${remarkText.trim()}"`) : bad(`unexpected remark: ${remarkText}`);

// Clean up — delete the test row
await calledRow.getByTitle("Remove").click();
await p.waitForTimeout(1000);
const stillThere = await p.locator('li:has-text("OUTCOME TEST ROW")').count();
stillThere === 0 ? ok("test row cleaned up") : bad("test row still present after delete");

await p.screenshot({ path: "test-artifacts/call-outcome.png", fullPage: true });
await b.close();
console.log("\nDONE");
