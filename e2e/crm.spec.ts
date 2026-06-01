import { test, expect } from "@playwright/test";
import { loginStaff, preparePage, staffCredentials } from "./helpers";

const creds = staffCredentials();

test.describe("CRM (admin)", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(!creds, "Set E2E_ADMIN_PHONE and E2E_ADMIN_PASSWORD in .env.e2e.local");

  test.beforeEach(async ({ page }) => {
    await preparePage(page);
    if (!creds) return;
    await loginStaff(page, creds.phone, creds.password);
  });

  test("CRM dashboard loads", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/crm/);
  });

  test("hot orders tab opens", async ({ page }) => {
    await page.goto("/crm?tab=hot");
    await expect(page).toHaveURL(/tab=hot/);
    await expect(page.getByRole("heading", { name: /Gorące zlecenia/i }).first()).toBeVisible();
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
