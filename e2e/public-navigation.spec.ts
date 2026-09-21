import { test, expect } from "@playwright/test";

test.describe("Public Website Navigation Suite", () => {
  const publicRoutes = [
    { path: "/", titleNeedle: "EthioTech" },
    { path: "/tracks", titleNeedle: "Tracks" },
    { path: "/tracks/fullstack-web", titleNeedle: "Fullstack Web" },
    { path: "/how-it-works", titleNeedle: "How" },
    { path: "/mentors", titleNeedle: "Mentors" },
    { path: "/hubs", titleNeedle: "Hubs" },
    { path: "/about", titleNeedle: "About" },
    { path: "/contact", titleNeedle: "Contact" },
    { path: "/leaderboard", titleNeedle: "Leaderboard" },
    { path: "/faq", titleNeedle: "FAQ" },
    { path: "/mentor-recruitment", titleNeedle: "Mentor" },
    { path: "/privacy", titleNeedle: "Privacy" },
    { path: "/terms", titleNeedle: "Terms" },
    { path: "/partners", titleNeedle: "Partners" },
    { path: "/donate", titleNeedle: "Donate" },
  ];

  for (const route of publicRoutes) {
    test(`loads public route ${route.path} without crash`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);

      // Verify page shell rendered
      await expect(page.locator("body")).toBeVisible();
      // Ensure no blank screen
      const rootHtml = await page.locator("#root").innerHTML();
      expect(rootHtml.trim().length).toBeGreaterThan(50);

      // Verify no catastrophic unhandled errors
      const criticalErrors = consoleErrors.filter(
        (err) => !err.includes("Download the React DevTools") && !err.includes("net::ERR_CONNECTION_REFUSED"),
      );
      expect(criticalErrors.length).toBe(0);
    });
  }

  test("Navbar links navigate to correct marketing pages", async ({ page }) => {
    await page.goto("/");

    // Click Tracks link
    await page.click('header nav a[href="/tracks"]');
    await expect(page).toHaveURL(/\/tracks$/);

    // Click Mentors link
    await page.click('header nav a[href="/mentors"]');
    await expect(page).toHaveURL(/\/mentors$/);

    // Click Hubs link
    await page.click('header nav a[href="/hubs"]');
    await expect(page).toHaveURL(/\/hubs$/);

    // Click About link
    await page.click('header nav a[href="/about"]');
    await expect(page).toHaveURL(/\/about$/);

    // Click Logo to return home
    await page.click('header a[href="/"]');
    await expect(page).toHaveURL(/\/$/);
  });

  test("Track card in /tracks leads to dedicated track detail page", async ({ page }) => {
    await page.goto("/tracks");
    // Click overview link on first track
    const overviewLink = page.locator('a[href^="/tracks/"]').first();
    await expect(overviewLink).toBeVisible();
    await overviewLink.click();
    await expect(page).toHaveURL(/\/tracks\/[a-z0-9-]+$/);
    await expect(page.locator("text=Curriculum Modules")).toBeVisible();
    await expect(page.locator("text=Market Demand")).toBeVisible();
  });

  test("Mobile hamburger drawer opens and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Open drawer
    const menuBtn = page.locator('header button[aria-label="Open navigation menu"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Check mobile links visible
    const mobileTracksLink = page.locator('#mobile-nav-drawer a[href="/tracks"]');
    await expect(mobileTracksLink).toBeVisible();
    await mobileTracksLink.click();
    await expect(page).toHaveURL(/\/tracks$/);
  });
});
