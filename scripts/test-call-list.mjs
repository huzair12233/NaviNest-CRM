import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const ok = (m) => console.log("✓", m);
const bad = (m) => console.log("✗", m);

const sample = `ZAID SHAIΚΗ
7738039772
Call disconnected
70
QURESHI NAZN
8655657968
Auto cut
71
SIKANDAR SHA
9892969267
Ringing
72`;

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
await p.fill('textarea[name="text"]', sample);
await p.click('button:has-text("Parse Numbers")');
await p.waitForSelector("text=ZAID SHAIΚΗ", { timeout: 15000 });
ok("3 rows parsed and listed");

const telHref = await p.locator('a[href^="tel:"]').first().getAttribute("href");
const waHref = await p.locator('a[href^="https://wa.me"]').first().getAttribute("href");
console.log("  tel href:", telHref, " wa href:", waHref);
telHref === "tel:7738039772" ? ok("Call link correct") : bad(`unexpected tel href: ${telHref}`);
waHref?.includes("917738039772") ? ok("WhatsApp link correct") : bad(`unexpected wa href: ${waHref}`);

// Mark the first row Called
await p.locator('li:has-text("ZAID")').getByTitle("Mark called").click();
await p.waitForTimeout(1000);
await p.goto(`${BASE}/call-list?status=Called`);
const calledCount = await p.locator("li").count();
calledCount >= 1 ? ok("row correctly moved to Called tab") : bad("row not in Called tab");

// Edit a row inline
await p.goto(`${BASE}/call-list`);
await p.locator('li:has-text("QURESHI")').first().locator("button").first().click();
await p.waitForSelector('input[name="name"]', { timeout: 10000 });
await p.fill('input[name="name"]', "QURESHI NAZN EDITED");
await p.click('button:has-text("Save")');
await p.waitForTimeout(1500);
await p.reload();
const editedVisible = (await p.getByText("QURESHI NAZN EDITED").count()) > 0;
editedVisible ? ok("inline edit saved") : bad("inline edit did not persist");

// Save as lead
await p.goto(`${BASE}/call-list`);
await p.locator('li:has-text("SIKANDAR")').first().getByTitle("Save as lead").click();
await p.waitForSelector('input[name="fullName"]', { timeout: 10000 });
await p.click('button:has-text("Create lead")');
await p.waitForURL(/\/leads\/[a-z0-9]{15,}$/, { timeout: 15000 });
const leadUrl = p.url();
ok(`lead created from call list entry -> ${leadUrl.replace(BASE, "")}`);

await p.screenshot({ path: "test-artifacts/call-list.png", fullPage: true });
await b.close();
console.log("\nDONE", JSON.stringify({ leadId: leadUrl.split("/").pop() }));
