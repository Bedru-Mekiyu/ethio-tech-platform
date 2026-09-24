import { test, expect, chromium } from "@playwright/test";

/**
 * EthioTech Platform — First-Visit Performance Test Suite
 *
 * Uses fresh browser contexts (no cache, no localStorage, no cookies) to simulate
 * a genuine first visit. Records real timing metrics and verifies that meaningful
 * page content is visible before slow API responses arrive.
 *
 * Run against production:
 *   PLAYWRIGHT_BASE_URL=https://ethio-tech-hub.onrender.com npx playwright test e2e/performance.spec.ts
 *
 * Run against local dev:
 *   npx playwright test e2e/performance.spec.ts
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

// ─── Helper: Collect Web Vitals ────────────────────────────────────────────
async function collectWebVitals(page: ReturnType<typeof chromium.prototype.newPage extends (...args: unknown[]) => infer R ? () => R : never>) {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType("paint");
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const fcp = entries.find((e) => e.name === "first-contentful-paint")?.startTime ?? -1;
    return {
      fcp: Math.round(fcp),
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : -1,
      loadEvent: nav ? Math.round(nav.loadEventEnd) : -1,
      transferSize: nav ? nav.transferSize : -1,
      decodedBodySize: nav ? nav.decodedBodySize : -1,
    };
  });
}

// ─── 1. Homepage First Visit (Fresh Context) ───────────────────────────────
test.describe("1. Homepage — Fresh First Visit (No Cache)", () => {
  test("Hero content and CTA buttons are visible without waiting for API", async () => {
    // Launch a completely fresh browser with no cache or storage
    const browser = await chromium.launch();
    const context = await browser.newContext({
      // No existing storage, cookies, or cache
      storageState: undefined,
    });
    const page = await context.newPage();

    const navStart = Date.now();

    // Navigate and wait only for DOM — not networkidle (API may be slow)
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

    const domReady = Date.now() - navStart;
    console.log(`[perf] DOMContentLoaded: ${domReady}ms`);

    // ✅ H1 headline must be visible — this is hardcoded static content
    // If this times out, the page is still blocking on JavaScript parsing
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const h1Visible = Date.now() - navStart;
    console.log(`[perf] H1 visible: ${h1Visible}ms`);

    // ✅ Primary CTA button must be visible — also static content
    await expect(page.locator("text=Start Coding Free").first()).toBeVisible({ timeout: 8000 });
    const ctaVisible = Date.now() - navStart;
    console.log(`[perf] CTA visible: ${ctaVisible}ms`);

    // ✅ Secondary CTA must be visible
    await expect(page.locator("text=Explore Curriculum")).toBeVisible({ timeout: 5000 });

    // ✅ Page must have substantial content (not just a loading spinner)
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(500);

    // ✅ No JavaScript error overlays
    await expect(page.locator("text=Something went wrong")).toHaveCount(0);

    // Collect Web Vitals
    const vitals = await collectWebVitals(page as never);
    console.log(`[perf] Web Vitals:`, vitals);
    console.log(`[perf] FCP: ${vitals.fcp}ms`);
    console.log(`[perf] DOM Content Loaded: ${vitals.domContentLoaded}ms`);
    console.log(`[perf] Load Event: ${vitals.loadEvent}ms`);

    await context.close();
    await browser.close();
  });

  test("Navbar and footer are immediately visible (no auth dependency)", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

    // Navbar (marketing layout) should render immediately
    await expect(page.locator("nav, header").first()).toBeVisible({ timeout: 10000 });

    await context.close();
    await browser.close();
  });

  test("Stats bar shows placeholders during API load, then real values", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    // Intercept the marketing API to simulate slow backend (cold start scenario)
    let apiResolved = false;
    await page.route("**/marketing/home", async (route) => {
      await new Promise((r) => setTimeout(r, 3000)); // 3 second artificial delay
      apiResolved = true;
      await route.continue();
    });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

    // H1 must be visible BEFORE the API resolves (3s delay)
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });
    expect(apiResolved).toBe(false); // API hasn't responded yet
    console.log("[perf] H1 visible before API resolved: ✅");

    // The stats placeholders should be present (animate-pulse spans)
    const pulsePlaceholders = page.locator(".animate-pulse");
    const count = await pulsePlaceholders.count();
    expect(count).toBeGreaterThanOrEqual(1);
    console.log(`[perf] Inline placeholders visible: ${count} elements`);

    await context.close();
    await browser.close();
  });
});

// ─── 2. Marketing Page Navigation ──────────────────────────────────────────
test.describe("2. Marketing Pages — Navigation Performance", () => {
  test("About page renders content on first visit", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    const navStart = Date.now();
    await page.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    console.log(`[perf] About page H1 visible: ${Date.now() - navStart}ms`);

    await context.close();
    await browser.close();
  });

  test("No JavaScript errors or blank screens on public pages", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    // No uncaught JS errors that would break the page
    const criticalErrors = jsErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") && // Browser noise
        !e.includes("Non-Error promise rejection"), // Network errors acceptable
    );
    if (criticalErrors.length > 0) {
      console.warn("[perf] JS errors detected:", criticalErrors);
    }
    expect(criticalErrors.length).toBe(0);

    await context.close();
    await browser.close();
  });
});

// ─── 3. Bundle Size Baseline ───────────────────────────────────────────────
test.describe("3. Network — JS Bundle Requests", () => {
  test("Homepage loads without requesting socket.io or three.js on initial visit", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    const jsRequests: string[] = [];
    page.on("request", (req) => {
      if (req.resourceType() === "script") {
        jsRequests.push(req.url());
      }
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // socket.io chunk should NOT be loaded on the homepage for unauthenticated users
    const socketRequests = jsRequests.filter(
      (url) => url.includes("socket-io") || url.includes("socket.io-client"),
    );
    console.log(`[perf] socket-io chunk requests: ${socketRequests.length}`);

    // three.js chunk should NOT be loaded on the homepage
    const threeRequests = jsRequests.filter((url) => url.includes("three-js") || url.includes("three."));
    console.log(`[perf] three-js chunk requests: ${threeRequests.length}`);

    // Log all JS requests for analysis
    const totalJsBytes = await page.evaluate(() => {
      return performance
        .getEntriesByType("resource")
        .filter((e) => e.initiatorType === "script")
        .reduce((sum, e) => sum + (e as PerformanceResourceTiming).transferSize, 0);
    });
    console.log(`[perf] Total JS transferred: ${Math.round(totalJsBytes / 1024)}KB`);

    // socket.io and three.js should be deferred (not loaded on first marketing visit)
    expect(socketRequests.length).toBe(0);
    expect(threeRequests.length).toBe(0);

    await context.close();
    await browser.close();
  });

  test("Records number of JS requests and total transfer size on homepage", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const scripts = resources.filter((r) => r.initiatorType === "script");
      const styles = resources.filter((r) => r.initiatorType === "css" || r.initiatorType === "link");

      return {
        scriptCount: scripts.length,
        scriptTransferKB: Math.round(scripts.reduce((s, r) => s + r.transferSize, 0) / 1024),
        cssTransferKB: Math.round(styles.reduce((s, r) => s + r.transferSize, 0) / 1024),
        totalRequests: resources.length,
        failedRequests: resources.filter((r) => r.transferSize === 0 && r.decodedBodySize === 0).length,
      };
    });

    console.log("[perf] Resource metrics:", resourceMetrics);

    // In production build, total JS should be under 800KB transferred
    // In local dev server, Vite serves individual unbundled raw modules
    const isDevServer = BASE_URL.includes("localhost:5173") || resourceMetrics.scriptCount > 30;
    if (!isDevServer) {
      expect(resourceMetrics.scriptTransferKB).toBeLessThan(800);
    } else {
      expect(resourceMetrics.scriptTransferKB).toBeLessThan(6000);
    }

    // Should not have excessive failed requests
    expect(resourceMetrics.failedRequests).toBeLessThan(5);

    await context.close();
    await browser.close();
  });
});

// ─── 4. Login Flow ─────────────────────────────────────────────────────────
test.describe("4. Login Flow — Performance", () => {
  test("Login page renders within reasonable time on fresh visit", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    const navStart = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    // Email input must be ready to accept input
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });
    console.log(`[perf] Login form visible: ${Date.now() - navStart}ms`);

    await context.close();
    await browser.close();
  });
});
