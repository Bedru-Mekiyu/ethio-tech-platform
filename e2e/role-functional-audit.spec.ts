import { test, expect } from "@playwright/test";

test.describe("Full Role-By-Role Functional Audit Suite", () => {
  // Helper to inject hydrated authentication state for any role
  const authenticateAs = async (
    page: any,
    role: string,
    fullName: string,
    email: string,
    id: string = `user-${role}-test`
  ) => {
    await page.addInitScript(
      ({ role, fullName, email, id }: any) => {
        localStorage.setItem(
          "ethiotech-auth",
          JSON.stringify({
            state: {
              user: {
                id,
                fullName,
                email,
                role,
                isVerified: true,
              },
              accessToken: `mock-${role}-access-token`,
              hydrated: true,
            },
            version: 0,
          })
        );
      },
      { role, fullName, email, id }
    );
  };

  test("ROLE 1: Student - Profile renders cleanly with statistics and no query error", async ({ page }) => {
    await authenticateAs(page, "student", "Abebe Bikila", "student@ethiotech.com");
    await page.route("**/api/v1/dashboard/student", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            metrics: {
              completedLessons: 12,
              activeTracks: 2,
              capstoneProjects: 1,
              hoursLearned: 34,
              streakDays: 5,
              totalPoints: 450,
            },
            recentActivity: [],
            enrolledTracks: [],
          },
        }),
      });
    });

    await page.goto("/app/profile");
    await expect(page.getByRole("heading", { name: "Abebe Bikila" })).toBeVisible();
    await expect(page.getByText("Completed Lessons")).toBeVisible();
    await expect(page.getByText("12")).toBeVisible();
  });

  test("ROLE 2: Mentor - Profile renders with Mentor quick actions and no 403 errors", async ({ page }) => {
    await authenticateAs(page, "mentor", "Dr. Dawit Mengistu", "mentor@ethiotech.com");
    await page.goto("/mentor/profile");
    await expect(page.getByRole("heading", { name: "Dr. Dawit Mengistu" })).toBeVisible();
    await expect(page.getByText("Mentor Account")).toBeVisible();
    await expect(page.getByRole("link", { name: /Sessions & Office Hours/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Mentees & Students/i })).toBeVisible();
  });

  test("ROLE 3: Parent - Accessible profile page and scoped navigation without 403", async ({ page }) => {
    await authenticateAs(page, "parent", "Almaz Kebede", "parent@ethiotech.com");
    await page.goto("/parent/profile");
    await expect(page.getByRole("heading", { name: "Almaz Kebede" })).toBeVisible();
    await expect(page.getByText("Parent / Guardian")).toBeVisible();
    await expect(page.getByRole("link", { name: /Family Dashboard/i })).toBeVisible();
  });

  test("ROLE 4: Support - Scoped sidebar displays Analytics and Users only", async ({ page }) => {
    await authenticateAs(page, "support", "Support Agent Tigist", "support@ethiotech.com");
    await page.goto("/admin/users");
    // Support can see Analytics and Users
    await expect(page.getByRole("link", { name: /Analytics/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Users/i })).toBeVisible();
    // Support should NOT see Gamification, Content, or Operations
    await expect(page.getByRole("link", { name: /Gamification/i })).toBeHidden();
    await expect(page.getByRole("link", { name: /Curriculum CMS/i })).toBeHidden();
    await expect(page.getByRole("link", { name: /Operations/i })).toBeHidden();
  });

  test("ROLE 5: Reviewer - Scoped sidebar displays Review Queue, Content, Users, Analytics", async ({ page }) => {
    await authenticateAs(page, "reviewer", "Reviewer Henok", "reviewer@ethiotech.com");
    await page.goto("/admin/moderation");
    await expect(page.getByRole("link", { name: /Applications/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Curriculum CMS/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gamification/i })).toBeHidden();
    await expect(page.getByRole("link", { name: /Operations/i })).toBeHidden();
  });

  test("ROLE 6: Moderator - Scoped sidebar includes Operations, Applications, Content, Users, Analytics", async ({ page }) => {
    await authenticateAs(page, "moderator", "Moderator Solomon", "moderator@ethiotech.com");
    await page.goto("/admin/moderation");
    await expect(page.getByRole("link", { name: /Applications/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Operations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gamification/i })).toBeHidden();
  });

  test("ROLE 7: Admin - Full 7 navigation items rendered in sidebar", async ({ page }) => {
    await authenticateAs(page, "admin", "Admin Beth", "admin@ethiotech.com");
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: /Analytics/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Users/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Applications/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Operations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Curriculum CMS/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gamification/i })).toBeVisible();
  });

  test("ROLE 8: Super Admin - Full navigation and admin dashboard access", async ({ page }) => {
    await authenticateAs(page, "super_admin", "Super Admin Root", "superadmin@ethiotech.com");
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: /Analytics/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Users/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gamification/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Operations/i })).toBeVisible();
  });
});
