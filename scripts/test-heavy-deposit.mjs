import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const MARK = "ZZTEST-HD-" + Date.now().toString().slice(-6);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

const ok = (m) => console.log("✓", m);
const bad = (m) => console.log("✗", m);

await p.goto(`${BASE}/login`);
await p.fill('input[name="email"]', process.env.ADMIN_EMAIL || "admin@navinest.in");
await p.fill('input[name="password"]', process.env.ADMIN_PASSWORD || "changeme123");
await p.click('button[type="submit"]');
await p.waitForURL("**/dashboard", { timeout: 20000 });
ok("logged in");

// 1. Create a Heavy Deposit property first (so the lead can match it)
await p.goto(`${BASE}/properties/new`);
await p.fill('input[name="title"]', `${MARK} Property`);
await p.selectOption('select[name="listingType"]', "HEAVY_DEPOSIT");
await p.fill('input[name="location"]', "TestVille");
await p.selectOption('select[name="bhk"]', "2");
await p.fill('input[name="carpetArea"]', "800");
await p.fill('input[name="deposit"]', "1500000");
await p.click('button:has-text("Add property")');
await p.waitForURL(/\/properties\/[a-z0-9]{15,}$/, { timeout: 15000 });
const propUrl = p.url();
const propId = propUrl.split("/").pop();
ok(`property created (${propId})`);

await p.waitForSelector("text=Heavy Deposit", { timeout: 10000 });
const priceText = await p.locator("text=/deposit/i").first().textContent();
(await p.locator("span.text-lg").filter({ hasText: /deposit/i }).count()) > 0
  ? ok(`property shows deposit price: "${(await p.locator('span.text-lg').first().textContent())?.trim()}"`)
  : bad(`property price text unclear: ${priceText}`);

// 2. Create a Heavy Deposit lead that should match it
await p.goto(`${BASE}/leads/new`);
await p.fill('input[name="fullName"]', `${MARK} Lead`);
await p.fill('input[name="phone"]', "9" + Date.now().toString().slice(-9));
await p.selectOption('select[name="interest"]', "HEAVY_DEPOSIT");
await p.selectOption('select[name="bhk"]', "2");
await p.fill('input[name="locations"]', "TestVille");
await p.fill('input[name="budgetMin"]', "1300000");
await p.fill('input[name="budgetMax"]', "1700000");
await p.click('button:has-text("Create lead")');
await p.waitForURL(/\/leads\/[a-z0-9]{15,}$/, { timeout: 15000 });
const leadUrl = p.url();
const leadId = leadUrl.split("/").pop();
ok(`lead created (${leadId})`);

const badge = await p.locator("text=Heavy Deposit").count();
badge > 0 ? ok("lead detail shows 'Heavy Deposit' badge") : bad("no Heavy Deposit badge on lead");

const depositBudgetRow = await p.locator("text=Deposit budget").count();
depositBudgetRow > 0 ? ok("requirement panel shows 'Deposit budget' label") : bad("missing 'Deposit budget' label");

// 3. Matching: the property should appear under Matched properties
await p.waitForTimeout(1500);
const matchedText = await p.locator("text=Matched properties").locator("xpath=../..").first().innerText().catch(() => "");
const matchFound = (await p.getByText(`${MARK} Property`).count()) > 0;
matchFound ? ok("new Heavy Deposit property appears in Matched properties") : bad(`property NOT matched — panel text: ${matchedText.slice(0, 200)}`);

// 4. Reverse match: property detail page should show the lead under Matched leads
await p.goto(propUrl);
await p.waitForTimeout(1500);
const reverseMatch = (await p.getByText(`${MARK} Lead`).count()) > 0;
reverseMatch ? ok("lead appears in property's Matched leads") : bad("lead NOT reverse-matched on property page");

// 5. Nav page: Heavy Deposit Leads list
await p.goto(`${BASE}/leads/heavy-deposit`);
await p.waitForSelector("text=Heavy Deposit Leads", { timeout: 10000 });
const inList = (await p.getByText(`${MARK} Lead`).count()) > 0;
inList ? ok("lead shows up on /leads/heavy-deposit") : bad("lead missing from Heavy Deposit Leads page");

// 6. Properties filter by listing type
await p.goto(`${BASE}/properties?listingType=HEAVY_DEPOSIT`);
await p.waitForSelector("table, ul");
const inPropList = (await p.getByText(`${MARK} Property`).count()) > 0;
inPropList ? ok("property shows up when filtering listingType=HEAVY_DEPOSIT") : bad("property missing from filtered list");

await p.screenshot({ path: "test-artifacts/heavy-deposit-test.png", fullPage: true });
await b.close();
console.log("\nDONE — lead:", leadId, "property:", propId);
console.log("CLEANUP_IDS", JSON.stringify({ leadId, propId }));
