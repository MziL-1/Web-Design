import { test, expect } from "@playwright/test";

test.describe("V2 E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
  });

  test("register and login creates a new account", async ({ page }) => {
    await page.goto("http://localhost:3000/register");
    const ts = Date.now();
    await page.fill('input[name="username"]', `testuser${ts}`);
    await page.fill('input[name="email"]', `test${ts}@example.com`);
    await page.fill('input[name="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/login/);

    await page.fill('input[name="email"]', `test${ts}@example.com`);
    await page.fill('input[name="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/[a-z0-9_-]+$/);

    await expect(page.locator("text=你正在编辑自己的博客")).toBeVisible();
  });

  test("search bar appears on homepage", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await expect(page.locator('input[placeholder*="搜索"]')).toBeVisible();
    await expect(page.locator('text=发现博客')).toBeVisible();
    await expect(page.locator('text=我的关注')).toBeVisible();
  });

  test("tab navigation switches between discover and following", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.click('text=我的关注');
    await expect(page.locator('text=还没有关注任何人')).toBeVisible();
    await page.click('text=发现博客');
    await expect(page.locator('text=发现博客')).toBeVisible();
  });
});
