import { test, expect } from "@playwright/test";

test.describe("Cross-Role and Authorization Boundaries Suite", () => {
  test("Public visitor sees Sign in / Join EthioTech CTAs on marketing navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('header a[href="/login"]')).toBeVisible();
    await expect(page.locator('header a[href="/register"]')).toBeVisible();
  });

  test("Authenticated student sees Dashboard CTA in marketing navbar instead of Sign in", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "student-qa-1",
              fullName: "Student Learner",
              email: "student@ethiotech.com",
              role: "student",
              isVerified: true,
            },
            accessToken: "mock-student-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });

    await page.goto("/");
    // Should display Dashboard button
    await expect(page.locator('header a[href="/app/dashboard"]')).toBeVisible();
    // Should NOT display Sign in button
    await expect(page.locator('header a[href="/login"]')).toBeHidden();
  });

  test("Authenticated mentor sees Dashboard CTA leading to /mentor in marketing navbar", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "mentor-qa-1",
              fullName: "Diaspora Mentor",
              email: "mentor@ethiotech.com",
              role: "mentor",
              isVerified: true,
            },
            accessToken: "mock-mentor-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });

    await page.goto("/");
    await expect(page.locator('header a[href="/mentor"]')).toBeVisible();
  });

  test("Authenticated admin sees Dashboard CTA leading to /admin in marketing navbar", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "admin-qa-1",
              fullName: "System Administrator",
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

    await page.goto("/");
    await expect(page.locator('header a[href="/admin"]')).toBeVisible();
  });

  test("Role elevation boundary: student cannot trigger administrative routes", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "student-qa-1",
              fullName: "Student Learner",
              email: "student@ethiotech.com",
              role: "student",
              isVerified: true,
            },
            accessToken: "mock-student-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });

    // Check multiple administrative routes
    for (const adminPath of ["/admin", "/admin/users", "/admin/operations", "/admin/content"]) {
      await page.goto(adminPath);
      // ProtectedRoute rejects and redirects to /
      await expect(page).toHaveURL(/\/$/);
    }
  });
});
