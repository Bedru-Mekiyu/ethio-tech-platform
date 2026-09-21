import { test, expect } from "@playwright/test";

test.describe("Admin Workflows", () => {
  test.beforeEach(async ({ page }) => {
    // Seed authenticated admin state in localStorage
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "admin-qa-1",
              fullName: "Platform Administrator",
              email: "admin@ethiotech.com",
              role: "admin",
              isVerified: true,
            },
            accessToken: "mock-admin-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });
  });

  test("Admin analytics dashboard loads", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("Admin can navigate across administrative modules", async ({ page }) => {
    await page.goto("/admin");

    // Users
    await page.click('aside a[href="/admin/users"]');
    await expect(page).toHaveURL(/\/admin\/users/);

    // Moderation
    await page.click('aside a[href="/admin/moderation"]');
    await expect(page).toHaveURL(/\/admin\/moderation/);

    // Content CMS
    await page.click('aside a[href="/admin/content"]');
    await expect(page).toHaveURL(/\/admin\/content/);

    // Gamification
    await page.click('aside a[href="/admin/gamification"]');
    await expect(page).toHaveURL(/\/admin\/gamification/);

    // Meetings
    await page.click('aside a[href="/admin/meetings"]');
    await expect(page).toHaveURL(/\/admin\/meetings/);

    // Operations / Platform Health
    await page.click('aside a[href="/admin/operations"]');
    await expect(page).toHaveURL(/\/admin\/operations/);
  });
});
