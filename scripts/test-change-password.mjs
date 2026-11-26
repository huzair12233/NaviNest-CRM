import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const BASE = "http://localhost:3000";
const ok = (m) => console.log("✓", m);
const bad = (m) => console.log("✗", m);

const db = new PrismaClient();
const EMAIL = "password.change.test@navinest.in";
const OLD_PW = "OldPass123!";
const NEW_PW = "NewPass456!";

const testUser = await db.user.create({
  data: { name: "Password Change Test", email: EMAIL, passwordHash: await bcrypt.hash(OLD_PW, 10), role: "SALES", avatarColor: "#888" },
});
ok(`created test user ${testUser.id}`);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await p.goto(`${BASE}/login`);
await p.fill('input[name="email"]', EMAIL);
await p.fill('input[name="password"]', OLD_PW);
await p.click('button[type="submit"]');
await p.waitForURL("**/dashboard", { timeout: 60000 });
ok("logged in with original password");

await p.goto(`${BASE}/account`);
await p.waitForSelector("text=Change password", { timeout: 15000 });
ok("Change password card visible on Account page");

// Wrong current password should be rejected
await p.fill('input[name="currentPassword"]', "WrongPassword!");
await p.fill('input[name="newPassword"]', NEW_PW);
await p.fill('input[name="confirmPassword"]', NEW_PW);
await p.click('button:has-text("Change password")');
await p.waitForTimeout(1200);
const errorShown = (await p.locator("text=Current password is incorrect").count()) > 0;
errorShown ? ok("wrong current password correctly rejected") : bad("wrong current password was NOT rejected");

// Mismatched confirm should be rejected
await p.fill('input[name="currentPassword"]', OLD_PW);
await p.fill('input[name="newPassword"]', NEW_PW);
await p.fill('input[name="confirmPassword"]', "Different123!");
await p.click('button:has-text("Change password")');
await p.waitForTimeout(1200);
const mismatchShown = (await p.locator("text=don't match").count()) > 0;
mismatchShown ? ok("mismatched confirm password correctly rejected") : bad("mismatched confirm password was NOT rejected");

// Correct flow should succeed
await p.fill('input[name="currentPassword"]', OLD_PW);
await p.fill('input[name="newPassword"]', NEW_PW);
await p.fill('input[name="confirmPassword"]', NEW_PW);
await p.click('button:has-text("Change password")');
await p.waitForTimeout(1500);
const successShown = (await p.locator("text=Password changed").count()) > 0;
successShown ? ok("password change succeeded with correct current password") : bad("expected success toast not shown");

// Fields should be cleared after success
const currentVal = await p.locator('input[name="currentPassword"]').inputValue();
currentVal === "" ? ok("form fields cleared after successful change") : bad(`fields not cleared: "${currentVal}"`);

await b.close();

// Confirm new password actually works for login, old one no longer does
const b2 = await chromium.launch();
const p2 = await b2.newPage();
await p2.goto(`${BASE}/login`);
await p2.fill('input[name="email"]', EMAIL);
await p2.fill('input[name="password"]', NEW_PW);
await p2.click('button[type="submit"]');
try {
  await p2.waitForURL("**/dashboard", { timeout: 15000 });
  ok("login with NEW password works");
} catch {
  bad("login with new password failed");
}
await b2.close();

const b3 = await chromium.launch();
const p3 = await b3.newPage();
await p3.goto(`${BASE}/login`);
await p3.fill('input[name="email"]', EMAIL);
await p3.fill('input[name="password"]', OLD_PW);
await p3.click('button[type="submit"]');
await p3.waitForTimeout(2000);
const stillOnLogin = p3.url().includes("/login");
stillOnLogin ? ok("login with OLD password correctly fails now") : bad("old password still works — not rotated!");
await b3.close();

// Cleanup
await db.user.delete({ where: { id: testUser.id } });
ok("cleaned up test user");
await db.$disconnect();
console.log("\nDONE");
