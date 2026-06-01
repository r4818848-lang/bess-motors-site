import { test, expect } from "@playwright/test";
import { loginStaff, preparePage, staffCredentials } from "./helpers";

const creds = staffCredentials();

test.describe("CRM (admin)", () => {
  test.skip(!creds, "Set E2E_ADMIN_PHONE and E2E_ADMIN_PASSWORD in .env.e2e.local");

  test.beforeEach(async ({ page }) => {
    await preparePage(page);
    if (!creds) return;
    await loginStaff(page, creds.phone, creds.password);
    await page.waitForURL(/\/crm/, { timeout: 20_000 });
  });

  test("CRM dashboard loads", async ({ page }) => {
    await expect(page.getByText(/Gorące zlecenia|Panel|CRM/i).first()).toBeVisible();
  });

  test("hot orders tab opens", async ({ page }) => {
    await page.goto("/crm?tab=hot");
    await expect(page.getByText(/Gorące zlecenia/i).first()).toBeVisible();
  });

  test("work orders list opens", async ({ page }) => {
    await page.goto("/crm/work-orders");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("button").first()).toBeVisible();
  });

  test("calendar page loads", async ({ page }) => {
    await page.goto("/crm/calendar");
    await expect(page.locator("body")).toBeVisible();
  });
});
