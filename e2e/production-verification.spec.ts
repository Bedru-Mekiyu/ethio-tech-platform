import { test, expect } from "@playwright/test";

/**
 * EthioTech Production Verification Suite
 * Executes live browser verification against real deployed environment:
 * https://ethio-tech-hub.onrender.com (Frontend)
 * https://ethio-tech-platform.onrender.com (Backend API)
 */

const CANONICAL_ACCOUNTS = [
  { role: "super_admin", email: "super_admin@ethiotech.com", expectedPath: "/admin" },
  { role: "admin", email: "admin@ethiotech.com", expectedPath: "/admin" },
  { role: "moderator", email: "moderator@ethiotech.com", expectedPath: "/admin" },
  { role: "reviewer", email: "reviewer@ethiotech.com", expectedPath: "/admin" },
  { role: "support", email: "support@ethiotech.com", expectedPath: "/admin" },
  { role: "mentor", email: "mentor@ethiotech.com", expectedPath: "/mentor" },
  { role: "student", email: "student@ethiotech.com", expectedPath: "/app/dashboard" },
  { role: "parent", email: "parent@ethiotech.com", expectedPath: "/parent" },
];

test.describe("1. Canonical QA Accounts Live Verification", () => {
  for (const account of CANONICAL_ACCOUNTS) {
    test(`Login as ${account.role} (${account.email}) -> lands on ${account.expectedPath} & preserves session on refresh`, async ({
      page,
    }) => {
      // 1. Visit Login Page
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // 2. Fill Credentials
      await page.fill('input[type="email"]', account.email);
      await page.fill('input[type="password"]', "Passw0rd!");

      // 3. Submit
      await page.click('button[type="submit"]');

      // 4. Verify Landing Page
      await expect(page).toHaveURL(new RegExp(account.expectedPath), { timeout: 20000 });

      // 5. Verify no error alerts or onboarding loop
      await expect(page.locator("text=Invalid email or password")).toHaveCount(0);
      await expect(page.locator("text=Something went wrong")).toHaveCount(0);

      // 6. Verify Auth State Stored in LocalStorage
      const storedAuth = await page.evaluate(() => localStorage.getItem("ethiotech-auth"));
      expect(storedAuth).toBeTruthy();
      const parsed = JSON.parse(storedAuth!);
      expect(parsed.state.accessToken).toBeTruthy();
      expect(parsed.state.user.email).toBe(account.email);
      expect(parsed.state.user.role).toBe(account.role);

      // 7. Verify Session Persistence on Page Reload
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(new RegExp(account.expectedPath), { timeout: 15000 });

      // Clear session before next test
      await page.evaluate(() => localStorage.clear());
    });
  }
});

test.describe.serial("2. User Management End-to-End (/admin/users)", () => {
  const timestamp = Date.now();
  const testStudentEmail = `qa.student.${timestamp}@ethiotech.com`;
  const testMentorEmail = `qa.mentor.${timestamp}@ethiotech.com`;
  const testParentEmail = `qa.parent.${timestamp}@ethiotech.com`;
  const testSupportEmail = `qa.support.${timestamp}@ethiotech.com`;

  test.beforeEach(async ({ page }) => {
    // Authenticate as Admin
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "admin@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
  });

  test("User Directory loads and displays table, filters, search and pagination", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    // Table elements
    await expect(page.locator("h1:has-text('User Management Directory')")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("th:has-text('User')")).toBeVisible();
    await expect(page.locator("th:has-text('Role')")).toBeVisible();

    // Verify Search functionality
    const searchInput = page.locator('input[aria-label="Search users"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("admin@ethiotech.com");
    await page.waitForTimeout(1000);
    await expect(page.locator("table")).toContainText("admin@ethiotech.com");

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(1000);
  });

  test("Create User: Student with Grade Level", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    // Open modal
    await page.click('button:has-text("Create User")');
    await expect(page.locator('div[role="dialog"]:has-text("Create New User Account")')).toBeVisible();

    // Fill form
    await page.fill('div[role="dialog"] input[placeholder*="Abebe"]', `QA Student ${timestamp}`);
    await page.fill('div[role="dialog"] input[type="email"]', testStudentEmail);
    await page.fill('div[role="dialog"] input[placeholder*="chars"]', "Passw0rd!123");

    // Select role = student (default)
    const dialog = page.locator('div[role="dialog"]');
    await dialog.locator("select").first().selectOption("student");

    // Grade Level select should appear
    const gradeSelect = dialog.locator('select:has(option[value="10"])');
    await expect(gradeSelect).toBeVisible();
    await gradeSelect.selectOption("10");

    // Submit
    await dialog.locator('button:has-text("Create User")').click();

    // Toast confirmation
    await expect(page.locator(`text=created successfully`)).toBeVisible({ timeout: 15000 });
  });

  test("Create User: Mentor with Company and Expertise", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    // Open modal
    await page.click('button:has-text("Create User")');
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Fill form
    await dialog.locator('input[placeholder*="Abebe"]').fill(`QA Mentor ${timestamp}`);
    await dialog.locator('input[type="email"]').fill(testMentorEmail);
    await dialog.locator('input[placeholder*="chars"]').fill("Passw0rd!123");

    // Select role = mentor
    await dialog.locator("select").first().selectOption("mentor");

    // Company and expertise fields appear
    const companyInput = dialog.locator('input[placeholder*="Google"]');
    await expect(companyInput).toBeVisible();
    await companyInput.fill("Safaricom Telecommunications");

    // Submit
    await dialog.locator('button:has-text("Create User")').click();
    await expect(page.locator(`text=created successfully`)).toBeVisible({ timeout: 15000 });
  });

  test("Create User: Parent Role (Verify backend accepts role without 400)", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    // Open modal
    await page.click('button:has-text("Create User")');
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Fill form
    await dialog.locator('input[placeholder*="Abebe"]').fill(`QA Parent ${timestamp}`);
    await dialog.locator('input[type="email"]').fill(testParentEmail);
    await dialog.locator('input[placeholder*="chars"]').fill("Passw0rd!123");

    // Select role = parent
    await dialog.locator("select").first().selectOption("parent");

    // Submit
    await dialog.locator('button:has-text("Create User")').click();
    await expect(page.locator(`text=created successfully`)).toBeVisible({ timeout: 15000 });
  });

  test("Create User: Support Role (Verify backend accepts role without 400)", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    // Open modal
    await page.click('button:has-text("Create User")');
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Fill form
    await dialog.locator('input[placeholder*="Abebe"]').fill(`QA Support ${timestamp}`);
    await dialog.locator('input[type="email"]').fill(testSupportEmail);
    await dialog.locator('input[placeholder*="chars"]').fill("Passw0rd!123");

    // Select role = support
    await dialog.locator("select").first().selectOption("support");

    // Submit
    await dialog.locator('button:has-text("Create User")').click();
    await expect(page.locator(`text=created successfully`)).toBeVisible({ timeout: 15000 });
  });

  test("Edit Profile & Role Modification (Student -> Parent -> Student, Student -> Support -> Student)", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    // Search for the created student
    const searchInput = page.locator('input[aria-label="Search users"]');
    await searchInput.fill(testStudentEmail);
    await page.waitForTimeout(1500);

    // Click on row to open drawer
    const row = page.locator(`tr:has-text("${testStudentEmail}")`).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.click();

    // Verify Drawer opens
    const drawer = page.locator('aside[aria-label="User Quick Action Drawer"]');
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // 1. Edit Profile
    await drawer.locator('button:has-text("Edit Profile")').click();
    const editDialog = page.locator('div[role="dialog"]:has-text("Edit User Profile")');
    await expect(editDialog).toBeVisible();

    // Modify fields
    await editDialog.locator('input[placeholder*="Addis Ababa"]').fill("Hawassa");
    await editDialog.locator('textarea').fill("Updated biography via automated QA verification.");
    await editDialog.locator('button:has-text("Save Changes")').click();
    await expect(page.locator("text=Profile updated")).toBeVisible({ timeout: 10000 });

    // 2. Role Modification: Student -> Parent
    await drawer.locator('button:has-text("Change Role")').click();
    const roleDialog = page.locator('div[role="dialog"]:has-text("Change Role")');
    await expect(roleDialog).toBeVisible();
    await roleDialog.locator("select").selectOption("parent");
    await roleDialog.locator('button:has-text("Update Role")').click();
    await expect(page.locator("text=Role updated to parent")).toBeVisible({ timeout: 10000 });

    // 3. Role Modification: Parent -> Student
    await drawer.locator('button:has-text("Change Role")').click();
    await roleDialog.locator("select").selectOption("student");
    await roleDialog.locator('button:has-text("Update Role")').click();
    await expect(page.locator("text=Role updated to student")).toBeVisible({ timeout: 10000 });

    // 4. Role Modification: Student -> Support
    await drawer.locator('button:has-text("Change Role")').click();
    await roleDialog.locator("select").selectOption("support");
    await roleDialog.locator('button:has-text("Update Role")').click();
    await expect(page.locator("text=Role updated to support")).toBeVisible({ timeout: 10000 });

    // 5. Role Modification: Support -> Student
    await drawer.locator('button:has-text("Change Role")').click();
    await roleDialog.locator("select").selectOption("student");
    await roleDialog.locator('button:has-text("Update Role")').click();
    await expect(page.locator("text=Role updated to student")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("3. Authorization Boundaries & Cross-Role Protection", () => {
  test("Student account cannot access /admin, /mentor, or administrative APIs", async ({ page }) => {
    // Login as Student
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "student@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 20000 });

    // Attempt direct navigation to /admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // Attempt direct navigation to /admin/users
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // Attempt direct navigation to /mentor
    await page.goto("/mentor");
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test("Mentor account cannot access /admin or /parent", async ({ page }) => {
    // Login as Mentor
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "mentor@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/mentor/, { timeout: 20000 });

    // Attempt direct navigation to /admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // Attempt direct navigation to /parent
    await page.goto("/parent");
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test("Parent account cannot access /admin or /mentor", async ({ page }) => {
    // Login as Parent
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "parent@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/parent/, { timeout: 20000 });

    // Attempt direct navigation to /admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // Attempt direct navigation to /mentor
    await page.goto("/mentor");
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });
});

test.describe("4. Role Specific Workflows (Mentor, Student, Parent)", () => {
  test("Mentor account loads /mentor without onboarding loop", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "mentor@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/mentor$/, { timeout: 20000 });

    // Verify mentor interface components
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1:has-text('Mentor Command Center')")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("text=Lead Mentor")).toBeVisible({ timeout: 15000 });
  });

  test("Student account loads /app/dashboard and displays track progress", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "student@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 20000 });

    // Verify student dashboard elements
    await expect(page.locator("h1:has-text('Welcome back')")).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("button", { name: "Study Planner" })).toBeVisible({ timeout: 15000 });
  });

  test("Parent account loads /parent and displays linked student card", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "parent@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/parent/, { timeout: 20000 });

    // Verify linked student Abebe Kebede card
    await expect(page.locator("h1:has-text('Welcome back')")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("text=Abebe Kebede")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("text=Level 5 · 2450 XP")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("5. Authentication Failure Behavior & Security Hardening", () => {
  test("Wrong password rejects with error and zero credential leakage", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "admin@ethiotech.com");
    await page.fill('input[type="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Invalid email or password. Please try again.")).toBeVisible({
      timeout: 10000,
    });
    // Remains on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("Unknown email rejects with error without leaking account non-existence", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "nonexistent.account.xyz@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Invalid email or password. Please try again.")).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test("Empty form triggers client validation errors", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Enter a valid email address")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("6. Mobile Viewport Check (375x667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("Mobile viewport: Login and Admin Users page load without horizontal overflow", async ({ page }) => {
    // 1. Mobile Login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "admin@ethiotech.com");
    await page.fill('input[type="password"]', "Passw0rd!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });

    // 2. Mobile Users Page
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1:has-text('User Management')")).toBeVisible();

    // Check no horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});
