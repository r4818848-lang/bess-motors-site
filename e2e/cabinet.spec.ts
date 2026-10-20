import { test, expect } from "@playwright/test";
import { preparePage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("cabinet redirects to booking", async ({ page }) => {
  await page.goto("/cabinet");
  await expect(page).toHaveURL(/\/booking/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("forgot password page loads", async ({ page }) => {
  await page.goto("/cabinet/forgot-password");
  await expect(page.locator("body")).toContainText(/hasł|password|tablic/i);
});
