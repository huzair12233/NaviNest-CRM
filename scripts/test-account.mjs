import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const ok = (m) => console.log("✓", m);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await p.goto(`${BASE}/login`);
await p.fill('input[name="email"]', process.env.ADMIN_EMAIL || "admin@navinest.in");
await p.fill('input[name="password"]', process.env.ADMIN_PASSWORD || "changeme123");
await p.click('button[type="submit"]');
await p.waitForURL("**/dashboard", { timeout: 60000 });

await p.goto(`${BASE}/account`);
await p.waitForSelector("text=Follow-up reminders");
ok("account page loaded");
console.log("  email not-configured notice count:", await p.locator("text=isn't set up on the server yet").count());
console.log("  telegram connect button count:", await p.locator("button:has-text(\"Connect Telegram\")").count());

await p.screenshot({ path: "test-artifacts/account-page.png", fullPage: true });

const emailCb = p.locator('input[name="notifyByEmail"]');
await emailCb.uncheck();
await p.click('button:has-text("Save")');
await p.waitForTimeout(1500);
ok("saved with email unchecked");

await b.close();
console.log("DONE");
