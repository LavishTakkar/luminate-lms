import { test, expect } from "@playwright/test";

/**
 * Auth smoke — proves the seed admin can log in and the Dashboard renders.
 * Requires the seed script to have run (pnpm --filter api seed).
 */
test("seed admin logs in and reaches dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

  await page.getByLabel("Email").fill("admin@lms.local");
  await page.getByLabel("Password").fill("admin1234");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /hello, seed/i })).toBeVisible();
});

test("unauthenticated dashboard bounces to login", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("courses page lists seeded courses for admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@lms.local");
  await page.getByLabel("Password").fill("admin1234");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("link", { name: /courses/i }).first().click();
  await expect(page).toHaveURL(/\/courses/);
  await expect(page.getByRole("heading", { name: /machine learning/i })).toBeVisible({
    timeout: 15_000,
  });
});
