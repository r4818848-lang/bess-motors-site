import { expect, test } from "@playwright/test";
import { preparePage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("staff calendar opens only from Telegram", async ({ page }) => {
  await page.goto("/telegram/calendar");
  await expect(page.getByRole("heading", { name: /BESS MOTORS|Календарь|Kalendarz/ })).toBeVisible();
  await expect(page.getByText(/Telegram/)).toBeVisible();
});

test("staff calendar API rejects a request without initData", async ({ request }) => {
  const res = await request.post("/api/staff/calendar", {
    data: { action: "create", date: "2026-11-09", time: "08:00" },
  });
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.ok).toBe(false);
});

test("empty initData and a client-supplied user id do not open the calendar", async ({ request }) => {
  const res = await request.post("/api/staff/calendar", {
    headers: { "x-telegram-init-data": "   " },
    data: { action: "session", telegramUserId: 1, user: { id: 1 } },
  });
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.ok).toBe(false);
  expect(body.error).toBe("missing");
});
