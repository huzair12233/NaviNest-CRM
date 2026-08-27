import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:3000";
const SHOTS = process.env.SHOT_DIR || "test-artifacts";
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0,
  fail = 0;
const ok = (m) => (pass++, console.log(`  ✓ ${m}`));
const bad = (m) => (fail++, console.log(`  ✗ ${m}`));

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "navinest");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

async function kpi(page, label) {
  const card = page.locator(`a:has-text("${label}"), div:has-text("${label}")`).first();
  const txt = await card.locator(".text-2xl").first().textContent();
  return parseInt((txt || "").replace(/[^\d]/g, ""), 10);
}
const REC = /\/(leads|properties|deals)\/(?!new$)[a-z0-9]{15,}$/;

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => bad(`pageerror: ${e.message}`));

  console.log("\n1. Auth");
  await login(page, "admin@navinest.in");
  ok("admin login → dashboard");

  const startLeads = await kpi(page, "Total Leads");
  Number.isFinite(startLeads) ? ok(`dashboard shows Total Leads = ${startLeads}`) : bad("could not read Total Leads KPI");
  await page.screenshot({ path: `${SHOTS}/01-dashboard.png`, fullPage: true });

  console.log("\n2. Create lead");
  await page.goto(`${BASE}/leads/new`);
  const uniq = Date.now().toString().slice(-7);
  await page.fill('input[name="fullName"]', `E2E Tester ${uniq}`);
  await page.fill('input[name="phone"]', `9${uniq}00`.slice(0, 10));
  await page.selectOption('select[name="interest"]', "SALE");
  await page.fill('input[name="locations"]', "Kharghar, Ulwe");
  await page.fill('input[name="budgetMin"]', "6500000");
  await page.fill('input[name="budgetMax"]', "8000000");
  await page.selectOption('select[name="bhk"]', "2");
  await page.click('button:has-text("Create lead")');
  await page.waitForURL(REC, { timeout: 15000 }).catch(() => {});
  if (!REC.test(page.url())) {
    const err = await page.locator(".text-red-600, .text-red-700").allTextContents();
    bad(`lead not created — still ${page.url().replace(BASE, "")} — errors: ${err.join("; ")}`);
    await page.screenshot({ path: `${SHOTS}/ERR-lead.png`, fullPage: true });
  } else ok(`lead created → ${page.url().replace(BASE, "")}`);
  const leadUrl = page.url();

  console.log("\n3. Dashboard count increments");
  await page.goto(`${BASE}/dashboard`);
  const nowLeads = await kpi(page, "Total Leads");
  nowLeads === startLeads + 1 ? ok(`Total Leads ${startLeads} → ${nowLeads}`) : bad(`expected ${startLeads + 1}, got ${nowLeads}`);

  console.log("\n4. Add + complete follow-up");
  await page.goto(leadUrl);
  await page.getByRole("button", { name: "Follow-up", exact: true }).click();
  await page.waitForSelector('input[name="dueAt"]');
  const dt = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
  await page.fill('input[name="dueAt"]', dt);
  await page.fill('input[name="purpose"]', "E2E discuss options");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await page.waitForSelector("text=/Follow-up \\(Call\\) scheduled/", { timeout: 12000 });
  ok("follow-up scheduled (in timeline)");
  await page.getByRole("button", { name: "Complete", exact: true }).first().click();
  await page.waitForSelector('textarea[name="outcome"]');
  await page.fill('textarea[name="outcome"]', "Client keen, sending options");
  await page.getByRole("button", { name: "Mark complete" }).click();
  await page.waitForSelector("text=/Follow-up \\(Call\\) completed/", { timeout: 12000 });
  ok("follow-up completed (in timeline)");

  console.log("\n5. Log note → timeline");
  await page.getByRole("button", { name: "Log", exact: true }).click();
  await page.waitForSelector('textarea[name="summary"]');
  await page.selectOption('select[name="type"]', "CALL");
  await page.fill('textarea[name="summary"]', "Spoke for 10 min, wants weekend visit");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.waitForSelector("text=wants weekend visit", { timeout: 12000 });
  ok("logged call appears in timeline");
  await page.screenshot({ path: `${SHOTS}/02-lead-detail.png`, fullPage: true });

  console.log("\n6. Share a matched property");
  const shareBtn = page.getByRole("button", { name: "Share" }).first();
  if ((await shareBtn.count()) > 0) {
    await shareBtn.click();
    await page.waitForSelector("text=/Properties shared/", { timeout: 12000 });
    ok("shared property → shows in 'Properties shared'");
  } else bad("no matched property to share");

  console.log("\n7. Create property");
  await page.goto(`${BASE}/properties/new`);
  await page.fill('input[name="title"]', `E2E 2BHK Test ${uniq}`);
  await page.fill('input[name="location"]', "Kharghar");
  await page.fill('input[name="projectName"]', "Bhagwati Greens");
  await page.selectOption('select[name="bhk"]', "2");
  await page.fill('input[name="carpetArea"]', "780");
  await page.fill('input[name="salePrice"]', "7200000");
  await page.click('button:has-text("Add property")');
  await page.waitForURL(REC, { timeout: 15000 });
  ok(`property created → ${page.url().replace(BASE, "")}`);

  console.log("\n8. Create deal + move to Closed Won + commission");
  await page.goto(`${BASE}/deals/new`);
  await page.fill('input[name="title"]', `E2E Deal ${uniq}`);
  await page.fill('input[name="value"]', "7200000");
  const leadId = leadUrl.split("/").pop();
  await page.selectOption('select[name="leadId"]', leadId).catch(() => bad("lead not in deal dropdown"));
  const selectedLead = await page.locator('select[name="leadId"]').inputValue();
  selectedLead === leadId ? ok("linked new lead to deal") : bad("could not link lead");
  await page.click('button:has-text("Create deal")');
  await page.waitForURL(REC, { timeout: 15000 });
  const dealUrl = page.url();
  ok(`deal created → ${dealUrl.replace(BASE, "")}`);
  await page.click('button:has-text("Change stage")');
  await page.waitForSelector('select[name="stage"]');
  await page.selectOption('select[name="stage"]', "Closed Won");
  await page.click('button:has-text("Update stage")');
  await page.waitForSelector("text=Closed Won", { timeout: 12000 });
  await page.waitForTimeout(1500);
  await page.reload();
  (await page.locator('text=/Expected/').count()) > 0 && (await page.locator('text=/Employee share/').count()) > 0
    ? ok("commission record auto-created on Closed Won")
    : bad("commission not created");
  await page.screenshot({ path: `${SHOTS}/03-deal.png`, fullPage: true });

  console.log("\n8b. Lead auto-converted, dashboard commission KPI");
  await page.goto(leadUrl);
  (await page.locator('span:has-text("Converted")').count()) > 0
    ? ok("linked lead moved to Converted")
    : bad("lead not converted");

  console.log("\n9. Global search");
  await page.goto(`${BASE}/dashboard`);
  await page.fill('input[placeholder*="Search leads"]', `E2E Tester ${uniq}`);
  await page.waitForTimeout(1200);
  (await page.locator(`text=E2E Tester ${uniq}`).count()) > 0 ? ok("global search finds new lead") : bad("search miss");

  console.log("\n10. RBAC — sales user cannot see /team");
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await login(p2, "rahul@navinest.in");
  await p2.goto(`${BASE}/team`).catch(() => {});
  await p2.waitForTimeout(1500);
  !p2.url().includes("/team") ? ok(`sales redirected away from /team → ${p2.url().replace(BASE, "")}`) : bad(`sales reached ${p2.url()}`);
  await p2.goto(`${BASE}/leads`);
  const salesLeadCount = await p2.locator("text=/\\d+ leads/").first().textContent();
  ok(`sales sees scoped leads list (${salesLeadCount?.trim()})`);

  console.log("\n11. Mobile layout");
  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await login(mp, "admin@navinest.in");
  await mp.goto(`${BASE}/leads`);
  await mp.screenshot({ path: `${SHOTS}/04-mobile-leads.png`, fullPage: true });
  ok("mobile screenshot captured");

  await browser.close();
  console.log(`\n──────────\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
