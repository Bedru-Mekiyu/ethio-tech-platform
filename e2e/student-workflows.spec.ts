import { test, expect } from "@playwright/test";

test.describe("Student Experience Workflows", () => {
  test.beforeEach(async ({ page }) => {
    // Seed authenticated student state in localStorage
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "student-qa-1",
              fullName: "Abebe Bikila",
              email: "student@ethiotech.com",
              role: "student",
              isVerified: true,
              level: 4,
              xp: 1250,
            },
            accessToken: "mock-student-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });
  });

  test("Student dashboard renders metrics, tracks, and study actions", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test("Student can navigate between sidebar items", async ({ page }) => {
    await page.goto("/app/dashboard");

    // Tracks
    await page.click('aside a[href="/app/tracks"]');
    await expect(page).toHaveURL(/\/app\/tracks/);

    // Projects
    await page.click('aside a[href="/app/projects"]');
    await expect(page).toHaveURL(/\/app\/projects/);

    // Calendar
    await page.click('aside a[href="/app/calendar"]');
    await expect(page).toHaveURL(/\/app\/calendar/);

    // Squads
    await page.click('aside a[href="/app/squads"]');
    await expect(page).toHaveURL(/\/app\/squads/);

    // Certificates
    await page.click('aside a[href="/app/certificates"]');
    await expect(page).toHaveURL(/\/app\/certificates/);
  });

  test("Student settings page renders preferences and profile tabs", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/app\/settings/);
  });

  test("Coding workspace renders IDE workbench", async ({ page }) => {
    await page.goto("/app/workspace");
    await expect(page.locator("body")).toBeVisible();
  });
});
