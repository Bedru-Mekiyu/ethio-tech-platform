import { test, expect } from "@playwright/test";

test.describe("Authentication and Route Guards", () => {
  test("Unauthenticated visitor is blocked from protected routes", async ({ page }) => {
    // Attempt visiting student dashboard without login
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/\/login/);

    // Attempt visiting mentor dashboard without login
    await page.goto("/mentor");
    await expect(page).toHaveURL(/\/login/);

    // Attempt visiting admin dashboard without login
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Login form shows validation errors on empty or invalid submit", async ({ page }) => {
    await page.goto("/login");

    // Click submit empty
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Enter a valid email address")).toBeVisible();

    // Fill invalid email
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "123");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Password must be at least 6 characters")).toBeVisible();
  });

  test("Guest is redirected away from /login if already authenticated", async ({ page }) => {
    // Inject student mock auth in localStorage
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "test-student-1",
              fullName: "Test Learner",
              email: "student@example.com",
              role: "student",
              isVerified: true,
            },
            accessToken: "mock-valid-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });

    await page.goto("/login");
    // Should immediately bounce to student dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test("Student cannot access admin routes (role-based guard)", async ({ page }) => {
    // Inject student auth
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "test-student-1",
              fullName: "Test Learner",
              email: "student@example.com",
              role: "student",
              isVerified: true,
            },
            accessToken: "mock-valid-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });

    // Try to visit /admin
    await page.goto("/admin");
    // ProtectedRoute role mismatch redirects to /
    await expect(page).toHaveURL(/\/$/);
  });

  test("Mentor cannot access admin routes (role-based guard)", async ({ page }) => {
    // Inject mentor auth
    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "test-mentor-1",
              fullName: "Test Mentor",
              email: "mentor@example.com",
              role: "mentor",
              mentorStatus: "approved",
              onboardingCompleted: true,
              isVerified: true,
            },
            accessToken: "mock-valid-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });

    // Try to visit /admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/);
  });
});
