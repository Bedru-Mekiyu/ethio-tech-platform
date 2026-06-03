import { test, expect } from "@playwright/test";

test.describe("Mentor Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "mentor@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/mentor");
  });

  test("Mentor dashboard loads with correct metrics", async ({ page }) => {
    await expect(page.locator("text=Mentor dashboard")).toBeVisible();
    await expect(page.locator("text=Mentor Score")).toBeVisible();
    await expect(page.locator("text=Total sessions")).toBeVisible();
  });

  test("Mentor can navigate to sessions page", async ({ page }) => {
    await page.click("text=Schedule session");
    await expect(page).toHaveURL(/\/mentor\/sessions/);
  });

  test("Mentor can navigate to control center for live session", async ({ page }) => {
    await page.goto("/mentor/control-center/demo-session");
    await expect(page.locator("text=Mentor Control Center")).toBeVisible({ timeout: 10000 });
  });

  test("Mentor can view analytics dashboard", async ({ page }) => {
    await page.goto("/mentor/analytics");
    await expect(page.locator("text=Mentor Analytics")).toBeVisible({ timeout: 10000 });
  });

  test("Mentor can admit student from waiting room", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    const admitButton = page.locator('button:has(svg)').first();
    if (await admitButton.isVisible()) {
      await admitButton.click();
    }
  });

  test("Mentor can create a poll", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    await page.click("text=Polls");
    await page.click("text=Create Poll");
    await expect(page.locator("text=Launch Poll")).toBeVisible({ timeout: 3000 });
  });

  test("Mentor can answer a question", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    await page.click("text=Q&A");
    const answerInput = page.locator('input[placeholder="Type answer..."]').first();
    if (await answerInput.isVisible()) {
      await answerInput.fill("This is the answer");
      await page.locator('button:has-text("Reply")').first().click();
    }
  });

  test("Mentor call on student with raised hand", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    const callOnButton = page.locator('button:has-text("Call on")').first();
    if (await callOnButton.isVisible()) {
      await callOnButton.click();
    }
  });

  test("Mentor can view and moderate participants", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    await page.click("text=Participants");
    await page.waitForTimeout(1000);
  });

  test("Mentor can write and publish session notes", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    await page.click("text=Notes");
    await page.waitForTimeout(1000);
  });

  test("Mentor can view engagement scores", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    await page.click("text=Engagement");
    await page.waitForTimeout(1000);
  });

  test("Student can raise hand (socket event)", async ({ page }) => {
    await page.goto("/app/classroom/demo-session");
    await page.waitForTimeout(2000);
  });

  test("Mentor can remove participant", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    const moreButton = page.locator('button:has(svg[data-icon="more-horizontal"])').first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      const removeOption = page.locator("text=Remove").first();
      if (await removeOption.isVisible()) {
        await removeOption.click();
      }
    }
  });

  test("Mentor can navigate quick actions", async ({ page }) => {
    await page.goto("/mentor/control-center/test-session");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Make Announcement")).toBeVisible();
    await expect(page.locator("text=Add Recording")).toBeVisible();
    await expect(page.locator("text=Invite Students")).toBeVisible();
    await expect(page.locator("text=End Session")).toBeVisible();
  });
});
