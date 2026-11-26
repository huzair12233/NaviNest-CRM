import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";

const BASE = "http://localhost:3000";
const ok = (m) => console.log("✓", m);
const bad = (m) => console.log("✗", m);

const db = new PrismaClient();

const baselineCount = await db.callListEntry.count();
ok(`baseline CallListEntry count: ${baselineCount}`);

// Two throwaway SALES accounts to prove peer isolation still holds
const PW = "TestPass123!";
const hash = await bcrypt.hash(PW, 10);
const userA = await db.user.create({ data: { name: "Oversight Test A", email: "oversight.test.a@navinest.in", passwordHash: hash, role: "SALES", avatarColor: "#888" } });
const userB = await db.user.create({ data: { name: "Oversight Test B", email: "oversight.test.b@navinest.in", passwordHash: hash, role: "SALES", avatarColor: "#888" } });
ok("created two throwaway SALES test accounts");

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
  await page.waitForTimeout(1200);
  return { browser, page };
}

const sessionA = await loginAndPaste("oversight.test.a@navinest.in", PW, "OVERSIGHT ROW A\n9333333331\nfrom A");
const sessionB = await loginAndPaste("oversight.test.b@navinest.in", PW, "OVERSIGHT ROW B\n9333333332\nfrom B");
ok("both test SALES accounts pasted their own row");

// A marks their row Called with a comment, to test calledAt/remark/calledBy columns
await sessionA.page.goto(`${BASE}/call-list`);
await sessionA.page.locator('li:has-text("OVERSIGHT ROW A")').first().getByTitle("Mark called").click();
await sessionA.page.waitForSelector("text=Call outcome", { timeout: 5000 });
await sessionA.page.locator('button:has-text("Interested")').first().click();
await sessionA.page.waitForTimeout(1200);
ok("A marked their row Called with outcome 'Interested'");

// Peer isolation: B should NOT see A's row
await sessionB.page.goto(`${BASE}/call-list?status=All`);
await sessionB.page.waitForTimeout(600);
const bView = await sessionB.page.locator("li").allTextContents();
!bView.some((t) => t.includes("OVERSIGHT ROW A")) ? ok("SALES peer isolation holds: B cannot see A's row") : bad("LEAK: B can see A's row");
bView.some((t) => t.includes("OVERSIGHT ROW B")) ? ok("B still sees their own row") : bad("B can't see their own row!");

await sessionA.browser.close();
await sessionB.browser.close();

// Admin oversight: Huzair should see BOTH test rows
const adminBrowser = await chromium.launch();
const adminPage = await adminBrowser.newPage();
await adminPage.goto(`${BASE}/login`);
await adminPage.fill('input[name="email"]', "huzair@navinest.in");
await adminPage.fill('input[name="password"]', "changeme123");
await adminPage.click('button[type="submit"]');
await adminPage.waitForURL("**/dashboard", { timeout: 60000 });
await adminPage.goto(`${BASE}/call-list?status=All`);
await adminPage.waitForTimeout(800);
const adminView = await adminPage.locator("li").allTextContents();
adminView.some((t) => t.includes("OVERSIGHT ROW A")) ? ok("Admin (parent account) sees A's row") : bad("Admin cannot see A's row");
adminView.some((t) => t.includes("OVERSIGHT ROW B")) ? ok("Admin (parent account) sees B's row") : bad("Admin cannot see B's row");

const totalNow = await db.callListEntry.count();
totalNow === baselineCount + 2 ? ok(`total row count correct: ${totalNow}`) : bad(`unexpected total: ${totalNow}`);

// Export test — download as admin and verify columns/row content
const cookies = await adminPage.context().cookies();
const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
const resp = await adminPage.request.get(`${BASE}/api/export/call-list?status=All`, { headers: { Cookie: cookieHeader } });
resp.ok() ? ok(`export endpoint responded ${resp.status()}`) : bad(`export failed: ${resp.status()}`);
const buf = await resp.body();
const wb = new ExcelJS.Workbook();
await wb.xlsx.load(buf);
const ws = wb.worksheets[0];
const headerRow = ws.getRow(1).values.filter(Boolean);
ok(`export headers: ${headerRow.join(" | ")}`);
console.log(`export row count (incl header): ${ws.rowCount}`);

let foundRowA = null;
ws.eachRow((row, i) => {
  if (i === 1) return;
  const vals = row.values;
  if (String(vals[1]).includes("OVERSIGHT ROW A")) foundRowA = vals;
});
if (foundRowA) {
  ok(`found exported row A: ${JSON.stringify(foundRowA)}`);
  String(foundRowA[3]).includes("Called") ? ok("exported Status = Called") : bad("Status column wrong");
  String(foundRowA[4]).includes("Interested") ? ok("exported Comment/Outcome = Interested") : bad("Comment column wrong");
  String(foundRowA[5]).includes("Oversight Test A") ? ok("exported Called By = Oversight Test A") : bad(`Called By wrong: ${foundRowA[5]}`);
  foundRowA[6] ? ok(`exported Called At populated: ${foundRowA[6]}`) : bad("Called At missing");
} else {
  bad("exported row A not found in workbook");
}

await adminBrowser.close();

// Cleanup — rows + test accounts
const removed = await db.callListEntry.deleteMany({ where: { OR: [{ name: "OVERSIGHT ROW A" }, { name: "OVERSIGHT ROW B" }] } });
ok(`cleaned up ${removed.count} test rows`);
await db.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
ok("cleaned up test accounts");

const finalCount = await db.callListEntry.count();
finalCount === baselineCount ? ok(`row count restored to baseline: ${finalCount}`) : bad(`count mismatch after cleanup: ${finalCount} vs ${baselineCount}`);

await db.$disconnect();
console.log("\nDONE");
