import { test, expect } from "@playwright/test";
import { preparePage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("health API returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty("ok");
  expect(body).toHaveProperty("ts");
});

test("home page loads with brand and booking CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/BESS MOTORS/i);
  await expect(page.getByRole("link", { name: /Umów|Zapisz|booking/i }).first()).toBeVisible();
});

test("main navigation pages respond 200", async ({ page }) => {
  const paths = [
    "/",
    "/services",
    "/cennik",
    "/gallery",
    "/booking",
    "/cabinet",
    "/about",
    "/contacts",
    "/faq",
  ];
  for (const path of paths) {
    const res = await page.goto(path);
    expect(res?.ok(), `${path} should load`).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  }
});
