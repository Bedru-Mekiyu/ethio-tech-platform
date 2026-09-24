import { test, expect } from "@playwright/test";

const PROD_URL = "https://ethio-tech-hub.onrender.com";

const ROLES = [
  {
    role: "student",
    email: "student@ethiotech.com",
    landing: "/app/dashboard",
    subpages: ["/app/tracks", "/app/certificates", "/app/calendar", "/app/progress", "/app/notifications"],
  },
  {
    role: "mentor",
    email: "mentor@ethiotech.com",
    landing: "/mentor",
    subpages: ["/mentor/sessions", "/mentor/students", "/mentor/availability", "/mentor/reviews"],
  },
  {
    role: "parent",
    email: "parent@ethiotech.com",
    landing: "/parent",
    subpages: ["/contact"],
  },
  {
    role: "admin",
    email: "admin@ethiotech.com",
    landing: "/admin",
    subpages: ["/admin/users", "/admin/content", "/admin/operations", "/admin/moderation"],
  },
];

test.describe("Reliability & First Interaction Audit", () => {
  test("Audit Attempt 1 vs Attempt 2 Across Roles", async ({ browser }) => {
    test.setTimeout(240_000);

    for (const r of ROLES) {
      console.log(`\n========================================`);
      console.log(`[TESTING ROLE] ${r.role} (${r.email})`);
      console.log(`========================================`);

      const context = await browser.newContext();
      const page = await context.newPage();

      const consoleErrors: string[] = [];
      const networkEvents: Array<{ method: string; url: string; status: number; duration?: number }> = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("response", (res) => {
        if (!res.url().includes("favicon")) {
          networkEvents.push({ method: res.request().method(), url: res.url(), status: res.status() });
        }
      });

      // 1. Visit Login and wait for full hydration
      await page.goto(`${PROD_URL}/login`, { waitUntil: "networkidle" });
      await page.waitForSelector('input[name="password"], input[type="password"]');

      await page.fill('input[type="email"]', r.email);
      await page.fill('input[type="password"]', "Passw0rd!");

      const tLogin0 = Date.now();
      const [loginResponse] = await Promise.all([
        page.waitForResponse((res) => res.url().includes("/auth/login"), { timeout: 30000 }).catch(() => null),
        page.click('button[type="submit"]'),
      ]);

      console.log(`[LOGIN API] Status: ${loginResponse?.status()} in ${Date.now() - tLogin0}ms`);
      if (loginResponse && loginResponse.status() !== 200) {
        const body = await loginResponse.text().catch(() => "");
        console.log(`[LOGIN ERROR BODY]:`, body);
      }

      await page.waitForURL(new RegExp(r.landing), { timeout: 25000 });
      console.log(`[LOGIN OK] Landed on ${r.landing}`);

      // 2. Check landing page UI for errors
      await page.waitForLoadState("networkidle");
      const landingErrors = await page.locator("text=Something went wrong, text=Unable to load, text=Not authorized, text=Failed to fetch").allTextContents();
      if (landingErrors.length > 0) {
        console.log(`[LANDING ATTEMPT 1 ERROR] Found UI errors on ${r.landing}:`, landingErrors);
      } else {
        console.log(`[LANDING ATTEMPT 1 OK] Clean landing on ${r.landing}`);
      }

      // 3. For each subpage, test Attempt 1 vs Attempt 2
      for (const sub of r.subpages) {
        const url = `${PROD_URL}${sub}`;
        const prevEventCount = networkEvents.length;
        const prevConsoleCount = consoleErrors.length;

        // Attempt 1: Navigate to subpage
        const t0 = Date.now();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 }).catch((e) => console.log(`  Goto error: ${e.message}`));
        await page.waitForTimeout(2000);
        const duration1 = Date.now() - t0;

        const attempt1UiErrors = await page.locator("text=Something went wrong, text=Unable to load, text=Not authorized, text=Failed to fetch").allTextContents();
        const attempt1HttpErrors = networkEvents.slice(prevEventCount).filter((e) => e.status >= 400);
        const attempt1ConsoleErrors = consoleErrors.slice(prevConsoleCount);

        // Attempt 2: Repeat the exact same action / reload
        const prevEventCount2 = networkEvents.length;
        const t1 = Date.now();
        await page.reload({ waitUntil: "domcontentloaded", timeout: 25000 }).catch((e) => console.log(`  Reload error: ${e.message}`));
        await page.waitForTimeout(2000);
        const duration2 = Date.now() - t1;

        const attempt2UiErrors = await page.locator("text=Something went wrong, text=Unable to load, text=Not authorized, text=Failed to fetch").allTextContents();
        const attempt2HttpErrors = networkEvents.slice(prevEventCount2).filter((e) => e.status >= 400);

        console.log(`\n  Route: ${sub}`);
        console.log(`    Attempt 1 (${duration1}ms): UI Errors=${attempt1UiErrors.length}, HTTP 4xx/5xx=${attempt1HttpErrors.length}, Console Errors=${attempt1ConsoleErrors.length}`);
        if (attempt1UiErrors.length > 0) console.log(`      Attempt 1 UI errors:`, attempt1UiErrors);
        if (attempt1HttpErrors.length > 0) console.log(`      Attempt 1 HTTP errors:`, attempt1HttpErrors);
        if (attempt1ConsoleErrors.length > 0) console.log(`      Attempt 1 Console:`, attempt1ConsoleErrors.slice(0, 3));

        console.log(`    Attempt 2 (${duration2}ms): UI Errors=${attempt2UiErrors.length}, HTTP 4xx/5xx=${attempt2HttpErrors.length}`);
        if (attempt2UiErrors.length > 0) console.log(`      Attempt 2 UI errors:`, attempt2UiErrors);
        if (attempt2HttpErrors.length > 0) console.log(`      Attempt 2 HTTP errors:`, attempt2HttpErrors);

        if (attempt1UiErrors.length > 0 && attempt2UiErrors.length === 0) {
          console.log(`    >>> CONFIRMED REPRODUCTION: Attempt 1 produced an error, but Attempt 2 worked! <<<`);
        }
      }

      await context.close();
    }
  });
});
