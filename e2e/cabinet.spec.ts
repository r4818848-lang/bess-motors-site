import { test, expect } from "@playwright/test";
import { preparePage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("cabinet shows login form", async ({ page }) => {
  await page.goto("/cabinet");
  await expect(page.locator("#bess-client-phone")).toBeVisible();
  await expect(page.locator("#bess-client-plate")).toBeVisible();
  await expect(page.getByRole("button", { name: /Zaloguj/i })).toBeVisible();
});

test("forgot password page loads", async ({ page }) => {
  await page.goto("/cabinet/forgot-password");
  await expect(page.locator("body")).toContainText(/hasł|password|tablic/i);
});
