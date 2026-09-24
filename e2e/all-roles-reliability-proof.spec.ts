import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const PROD_URL = process.env.PLAYWRIGHT_BASE_URL || "https://ethio-tech-hub.onrender.com";

interface RoleConfig {
  role: string;
  email: string;
  expectedLanding: string;
  subpages: string[];
}

const CANONICAL_ROLES: RoleConfig[] = [
  {
    role: "super_admin",
    email: "super_admin@ethiotech.com",
    expectedLanding: "/admin",
    subpages: [
      "/admin/users",
      "/admin/moderation",
      "/admin/content",
      "/admin/gamification",
      "/admin/meetings",
      "/admin/operations",
    ],
  },
  {
    role: "admin",
    email: "admin@ethiotech.com",
    expectedLanding: "/admin",
    subpages: [
      "/admin/users",
      "/admin/moderation",
      "/admin/content",
      "/admin/gamification",
      "/admin/meetings",
      "/admin/operations",
    ],
  },
  {
    role: "moderator",
    email: "moderator@ethiotech.com",
    expectedLanding: "/admin",
    subpages: [
      "/admin/users",
      "/admin/moderation",
      "/admin/content",
      "/admin/operations",
    ],
  },
  {
    role: "reviewer",
    email: "reviewer@ethiotech.com",
    expectedLanding: "/admin",
    subpages: [
      "/admin/moderation",
      "/admin/content",
      "/admin/users",
    ],
  },
  {
    role: "support",
    email: "support@ethiotech.com",
    expectedLanding: "/admin",
    subpages: [
      "/admin/users",
    ],
  },
  {
    role: "mentor",
    email: "mentor@ethiotech.com",
    expectedLanding: "/mentor",
    subpages: [
      "/mentor/sessions",
      "/mentor/students",
      "/mentor/availability",
      "/mentor/reviews",
      "/mentor/notifications",
    ],
  },
  {
    role: "student",
    email: "student@ethiotech.com",
    expectedLanding: "/app/dashboard",
    subpages: [
      "/app/tracks",
      "/app/projects",
      "/app/sessions",
      "/app/squads",
      "/app/progress",
      "/app/mentors",
      "/app/messages",
      "/app/calendar",
      "/app/certificates",
    ],
  },
  {
    role: "parent",
    email: "parent@ethiotech.com",
    expectedLanding: "/parent",
    subpages: [
      "/app/progress",
      "/app/sessions",
      "/app/notifications",
      "/contact",
    ],
  },
];

export interface RunResult {
  runNumber: number;
  role: string;
  email: string;
  initialVisitMs: number;
  loginAttempt1: "SUCCESS" | "FAIL";
  loginStatus: number;
  loginDurationMs: number;
  redirectAttempt1: "SUCCESS" | "FAIL";
  redirectPath: string;
  redirectDurationMs: number;
  dashboardAttempt1: "SUCCESS" | "FAIL";
  dashboardErrors: string[];
  primaryNavAttempt1: "SUCCESS" | "FAIL";
  subpageResults: Array<{
    subpage: string;
    durationMs: number;
    uiErrors: string[];
    httpErrors: Array<{ method: string; url: string; status: number }>;
    consoleErrors: string[];
    attempt1: "SUCCESS" | "FAIL";
  }>;
  overallAttempt1: "SUCCESS" | "FAIL";
}

const allRunResults: RunResult[] = [];

test.describe("All 8 Roles First-Attempt Reliability Proof", () => {
  // 8 roles * 3 runs = 24 runs
  for (let runIdx = 1; runIdx <= 3; runIdx++) {
    for (const roleConfig of CANONICAL_ROLES) {
      test(`Run ${runIdx} - Role: ${roleConfig.role} (${roleConfig.email})`, async ({ browser }) => {
        test.setTimeout(180_000);

        console.log(`\n======================================================`);
        console.log(`[START RUN ${runIdx}/3] Role: ${roleConfig.role} | Email: ${roleConfig.email}`);
        console.log(`======================================================`);

        // Create completely fresh isolated context
        const context = await browser.newContext({
          viewport: { width: 1280, height: 800 },
          ignoreHTTPSErrors: true,
        });
        const page = await context.newPage();

        const consoleErrors: string[] = [];
        const networkEvents: Array<{ method: string; url: string; status: number; duration?: number }> = [];

        page.on("console", (msg) => {
          if (msg.type() === "error") {
            const txt = msg.text();
            // Filter out benign browser noise if any
            if (!txt.includes("favicon") && !txt.includes("socket.io")) {
              consoleErrors.push(txt);
            }
          }
        });

        page.on("response", (res) => {
          const url = res.url();
          if (!url.includes("favicon") && !url.includes(".svg") && !url.includes(".png")) {
            networkEvents.push({ method: res.request().method(), url, status: res.status() });
          }
        });

        // 1. Visit Login Page directly in fresh context
        const t0Visit = Date.now();
        await page.goto(`${PROD_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForSelector('input[type="email"]', { timeout: 20000 });
        await page.waitForSelector('input[type="password"]', { timeout: 20000 });
        const initialVisitMs = Date.now() - t0Visit;
        console.log(`[VISIT] Login loaded in ${initialVisitMs}ms`);

        // 2. Perform First Attempt Login
        await page.fill('input[type="email"]', roleConfig.email);
        await page.fill('input[type="password"]', "Passw0rd!");

        const t0Login = Date.now();
        const [loginResponse] = await Promise.all([
          page.waitForResponse((res) => res.url().includes("/auth/login"), { timeout: 30000 }).catch(() => null),
          page.click('button[type="submit"]'),
        ]);

        const loginDurationMs = Date.now() - t0Login;
        const loginStatus = loginResponse?.status() ?? 0;
        const loginAttempt1 = loginStatus === 200 ? "SUCCESS" : "FAIL";
        console.log(`[LOGIN] Status: ${loginStatus} (${loginAttempt1}) in ${loginDurationMs}ms`);
        expect(loginStatus, `Login for ${roleConfig.role} on attempt 1 failed with status ${loginStatus}`).toBe(200);

        // 3. Verify First Redirect
        const t0Redirect = Date.now();
        await page.waitForURL(new RegExp(roleConfig.expectedLanding), { timeout: 25000 });
        const redirectDurationMs = Date.now() - t0Redirect;
        const currentUrl = page.url();
        const redirectAttempt1 = currentUrl.includes(roleConfig.expectedLanding) ? "SUCCESS" : "FAIL";
        console.log(`[REDIRECT] Landed on ${currentUrl} in ${redirectDurationMs}ms (${redirectAttempt1})`);
        expect(redirectAttempt1, `Redirect for ${roleConfig.role} failed to land on ${roleConfig.expectedLanding}`).toBe("SUCCESS");

        // 4. Verify First Dashboard Render
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(1500); // Allow react-query hooks to settle

        const errorLocators = page.locator("text=Something went wrong, text=Unable to load, text=Not authorized, text=Failed to fetch");
        const dashboardErrors = await errorLocators.allTextContents();
        const dashboardAttempt1 = dashboardErrors.length === 0 ? "SUCCESS" : "FAIL";
        console.log(`[DASHBOARD] Render attempt 1: ${dashboardAttempt1} (Errors: ${dashboardErrors.length})`);
        expect(dashboardErrors.length, `Dashboard render showed errors: ${dashboardErrors.join(", ")}`).toBe(0);

        // 5. Test First-Click on Primary Nav Subpages
        const subpageResults: RunResult["subpageResults"] = [];
        let anyNavFailed = false;

        for (const sub of roleConfig.subpages) {
          const t0Sub = Date.now();
          const prevNetworkCount = networkEvents.length;
          const prevConsoleCount = consoleErrors.length;

          // Attempt to click the desktop sidebar link directly if visible, else navigate cleanly
          const sidebarLink = page.locator(`aside nav a[href="${sub}"]`).first();
          const isLinkVisible = await sidebarLink.isVisible().catch(() => false);

          if (isLinkVisible) {
            await sidebarLink.click();
          } else {
            await page.goto(`${PROD_URL}${sub}`, { waitUntil: "domcontentloaded", timeout: 25000 });
          }

          await page.waitForURL(new RegExp(sub), { timeout: 20000 });
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(1500); // Allow queries to populate

          const durationMs = Date.now() - t0Sub;
          const uiErrors = await page.locator("text=Something went wrong, text=Unable to load, text=Not authorized, text=Failed to fetch").allTextContents();
          const httpErrors = networkEvents.slice(prevNetworkCount).filter((e) => e.status >= 400 && !e.url.includes("avatar"));
          const pageConsoleErrors = consoleErrors.slice(prevConsoleCount);

          const subAttempt1 = uiErrors.length === 0 && httpErrors.length === 0 ? "SUCCESS" : "FAIL";
          if (subAttempt1 === "FAIL") anyNavFailed = true;

          console.log(`  [NAV SUBPAGE] ${sub} -> ${subAttempt1} in ${durationMs}ms (UI Errors: ${uiErrors.length}, HTTP Errors: ${httpErrors.length})`);
          if (uiErrors.length > 0) console.log(`    UI Errors:`, uiErrors);
          if (httpErrors.length > 0) console.log(`    HTTP Errors:`, httpErrors);

          subpageResults.push({
            subpage: sub,
            durationMs,
            uiErrors,
            httpErrors,
            consoleErrors: pageConsoleErrors,
            attempt1: subAttempt1,
          });

          expect(uiErrors.length, `Subpage ${sub} showed UI errors: ${uiErrors.join(", ")}`).toBe(0);
          expect(httpErrors.length, `Subpage ${sub} had HTTP errors: ${JSON.stringify(httpErrors)}`).toBe(0);
        }

        const primaryNavAttempt1 = anyNavFailed ? "FAIL" : "SUCCESS";
        const overallAttempt1 =
          loginAttempt1 === "SUCCESS" &&
          redirectAttempt1 === "SUCCESS" &&
          dashboardAttempt1 === "SUCCESS" &&
          primaryNavAttempt1 === "SUCCESS"
            ? "SUCCESS"
            : "FAIL";

        const runRecord: RunResult = {
          runNumber: runIdx,
          role: roleConfig.role,
          email: roleConfig.email,
          initialVisitMs,
          loginAttempt1,
          loginStatus,
          loginDurationMs,
          redirectAttempt1,
          redirectPath: currentUrl,
          redirectDurationMs,
          dashboardAttempt1,
          dashboardErrors,
          primaryNavAttempt1,
          subpageResults,
          overallAttempt1,
        };

        allRunResults.push(runRecord);

        // Append to json summary file on disk
        const resultsDir = path.resolve(process.cwd(), "e2e-results");
        if (!fs.existsSync(resultsDir)) {
          fs.mkdirSync(resultsDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(resultsDir, "reliability-proof-results.json"),
          JSON.stringify(allRunResults, null, 2),
        );

        await context.close();
      });
    }
  }
});
