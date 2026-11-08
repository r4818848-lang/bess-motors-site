import { expect, test } from "@playwright/test";
import { preparePage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("the work planner is off unless the owner enables it", async ({ page, request }) => {
  const pageResponse = await page.goto("/telegram/scheduler");
  expect(pageResponse?.status()).toBe(404);
  const operations = await request.get("/api/internal/operations");
  expect(operations.status()).toBe(404);
  const preview = await request.post("/api/internal/schedule/preview", { data: { jobs: [] } });
  expect(preview.status()).toBe(404);
  const reservations = await request.post("/api/internal/schedule/reservations", { data: {} });
  expect(reservations.status()).toBe(404);
  await page.goto("/telegram/calendar");
  await expect(page.getByTestId("telegram-calendar-gate")).toBeVisible();
});
