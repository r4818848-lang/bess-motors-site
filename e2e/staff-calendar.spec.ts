import { expect, test } from "@playwright/test";
import { preparePage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("staff calendar opens only from Telegram", async ({ page }) => {
  let calendarApi = 0;
  page.on("request", (req) => {
    if (req.url().includes("/api/staff/calendar")) calendarApi += 1;
  });
  await page.goto("/telegram/calendar");
  await expect(page.getByRole("heading", { name: /BESS MOTORS|Календарь|Kalendarz/ })).toBeVisible();
  await expect(page.getByTestId("telegram-calendar-gate")).toContainText(/Telegram/);
  await expect(page.getByRole("button", { name: /Повторить|Ponów|Повторити|Retry/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Сегодня" })).toHaveCount(0);
  expect(calendarApi).toBe(0);
});

test("calendar waits for a late SDK and rejects an unsigned launch", async ({ page }) => {
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) => route.abort());
  await page.addInitScript(() => {
    window.setTimeout(() => {
      const target = window as Window & {
        Telegram?: { WebApp?: { initData?: string; platform?: string; ready?: () => void; expand?: () => void } };
      };
      target.Telegram = {
        WebApp: {
          initData: "auth_date=1&hash=00",
          platform: "web",
          ready() {},
          expand() {},
        },
      };
    }, 200);
  });
  await page.route("**/api/staff/calendar", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "bad_signature" }),
    })
  );
  await page.goto("/telegram/calendar");
  await expect(page.getByTestId("telegram-calendar-denied")).toBeVisible();
  await expect(page.getByText(/Подпись Telegram не прошла проверку/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Сегодня" })).toHaveCount(0);
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
