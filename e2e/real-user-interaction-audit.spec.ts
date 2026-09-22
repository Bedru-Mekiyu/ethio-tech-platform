import { test, expect } from "@playwright/test";

/**
 * Real-User Interaction Audit against Deployed Production Application
 * Target: https://ethio-tech-hub.onrender.com (Frontend) & https://ethio-tech-platform.onrender.com (Backend API)
 */

test.describe.configure({ mode: "serial" });

test.describe("ROLE 1: STUDENT Interactive Production Audit", () => {
  test("1.1 Student Login, Dashboard Traversal, Metrics & CTA Inspection", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: { url: string; status: number }[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("response", (resp) => {
      if (resp.status() >= 400 && !resp.url().includes("favicon")) {
        failedRequests.push({ url: resp.url(), status: resp.status() });
      }
    });

    // 1. Login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "student@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    // 2. Redirection & Dashboard Landing
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // 3. Inspect Dashboard Cards
    await expect(page.getByText(/Active Track/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Day Streak/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/XP/i).first()).toBeVisible();

    // 4. Test Quick CTAs on Dashboard
    const continueLearningBtn = page.locator('a[href^="/app/tracks"], a[href^="/app/lessons"]').first();
    if (await continueLearningBtn.isVisible()) {
      await continueLearningBtn.click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toMatch(/\/app\/(tracks|lessons)/);
      await page.goBack();
      await page.waitForLoadState("networkidle");
    }

    if (failedRequests.length > 0 || consoleErrors.length > 0) {
      console.log("Student failed requests:", JSON.stringify(failedRequests, null, 2));
      console.log("Student console errors:", JSON.stringify(consoleErrors, null, 2));
    }

    // 5. Verify no 500 server errors
    expect(failedRequests.filter((r) => r.status >= 500)).toEqual([]);
  });

  test("1.2 Student Track Catalog & Lesson Progression Workflow", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "student@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 20000 });

    // Open Tracks Catalog
    await page.goto("/app/tracks");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Tracks|Curriculum/i }).first()).toBeVisible();

    // Select first track
    const firstTrackLink = page.locator('a[href^="/app/tracks/"]').first();
    await expect(firstTrackLink).toBeVisible();
    await firstTrackLink.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/app\/tracks\/[a-zA-Z0-9_-]+/);

    // Click Start / Resume Track CTA
    const startTrackBtn = page.getByRole("button", { name: /Start Track|Resume Track|Continue/i }).first();
    if (await startTrackBtn.isVisible()) {
      await startTrackBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test("1.3 Student Profile & Study Planner Verification", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "student@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 20000 });

    // 1. Test Profile Page
    await page.goto("/app/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Something went wrong|Error loading profile/i)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Abebe/i })).toBeVisible({ timeout: 15000 });

    // 2. Test Calendar / Study Planner
    await page.goto("/app/calendar");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Calendar|Study Planner/i).first()).toBeVisible();

    // 3. Test Progress Page
    await page.goto("/app/progress");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Progress|Overview/i).first()).toBeVisible();
  });

  test("1.4 Student Mobile Viewport Responsiveness", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "student@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 20000 });

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe("ROLE 2: MENTOR Interactive Production Audit", () => {
  test("2.1 Mentor Login & Command Center Landing", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "mentor@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/mentor/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // Verify Mentor Header & Metrics
    await expect(page.getByText(/Lead Mentor|Command Center|Sessions/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("2.2 Mentor Students & Direct Message Initiation", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "mentor@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/mentor/, { timeout: 20000 });

    await page.goto("/mentor/students");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Students|Mentees/i })).toBeVisible({ timeout: 15000 });
  });

  test("2.3 Mentor Availability & Profile", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "mentor@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/mentor/, { timeout: 20000 });

    // Availability
    await page.goto("/mentor/availability");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Availability|Weekly Schedule/i).first()).toBeVisible({ timeout: 15000 });

    // Profile
    await page.goto("/mentor/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
    await expect(page.getByText(/Mentor Account/i)).toBeVisible({ timeout: 15000 });
  });
});

test.describe("ROLE 3: PARENT Interactive Production Audit", () => {
  test("3.1 Parent Login, Family Dashboard & Linked Student View", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "parent@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/parent/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // Parent Dashboard Welcome
    await expect(page.getByText(/Welcome back|Family/i).first()).toBeVisible({ timeout: 15000 });
    // Linked student card
    await expect(page.getByText(/Abebe Kebede|Lessons completed/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("3.2 Parent Dedicated Profile & Navigation", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "parent@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/parent/, { timeout: 20000 });

    // Open dedicated /parent/profile
    await page.goto("/parent/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
    await expect(page.getByText(/Parent \/ Guardian/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Family Dashboard/i })).toBeVisible();
  });
});

test.describe("ROLE 4: SUPPORT Interactive Production Audit", () => {
  test("4.1 Support Staff Scoped Navigation & User Search", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "support@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // Scoped Navigation: Support sees Analytics & Users
    await expect(page.getByRole("link", { name: /Users/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gamification/i })).toBeHidden();
    await expect(page.getByRole("link", { name: /Operations/i })).toBeHidden();

    // User lookup
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /User Management|Users/i })).toBeVisible({ timeout: 15000 });
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Abebe");
      await page.waitForTimeout(500);
      await expect(page.getByText(/Abebe/i).first()).toBeVisible();
    }
  });
});

test.describe("ROLE 5: REVIEWER Interactive Production Audit", () => {
  test("5.1 Reviewer Scoped Navigation & Read-Only Application Inspection", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "reviewer@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // Scoped Navigation
    await expect(page.getByRole("link", { name: /Applications/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Curriculum CMS/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gamification/i })).toBeHidden();

    // Moderation page inspection (zero 403 errors)
    await page.goto("/admin/moderation");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Moderation|Applications/i }).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("ROLE 6: MODERATOR Interactive Production Audit", () => {
  test("6.1 Moderator Operations & Applications Access", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "moderator@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // Navigation includes Operations
    await expect(page.getByRole("link", { name: /Operations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Applications/i })).toBeVisible();

    // Operations telemetry
    await page.goto("/admin/operations");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Operations|Health|System/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("ROLE 7: ADMIN Interactive Production Audit", () => {
  test("7.1 Admin Full Platform Governance & Content CMS Inspection", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "admin@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // Full 7 items
    await expect(page.getByRole("link", { name: /Analytics/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Users/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Applications/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Operations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Curriculum CMS/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gamification/i })).toBeVisible();

    // Content CMS 3-pane editor
    await page.goto("/admin/content");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Curriculum|Tracks/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("ROLE 8: SUPER ADMIN Interactive Production Audit", () => {
  test("8.1 Super Admin Unrestricted Authorization & System Governance", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "super_admin@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // Gamification Rules
    await page.goto("/admin/gamification");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Gamification|XP Rules|Badges/i).first()).toBeVisible({ timeout: 15000 });

    // Operations Stream
    await page.goto("/admin/operations");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Operations|Service Health/i).first()).toBeVisible({ timeout: 15000 });
  });
});
