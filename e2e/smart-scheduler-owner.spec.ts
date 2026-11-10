import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { preparePage } from "./helpers";

function signedInitData(): string {
  const params = new URLSearchParams();
  params.set("auth_date", String(Math.floor(Date.now() / 1000)));
  params.set("query_id", "AA");
  params.set("user", JSON.stringify({ id: 77, username: "owner", language_code: "ru" }));
  const pairs = [...params.entries()].map(([key, value]) => `${key}=${value}`).sort();
  const secret = createHmac("sha256", "WebAppData").update(process.env.TELEGRAM_BOT_TOKEN ?? "").digest();
  const hash = createHmac("sha256", secret).update(pairs.join("\n")).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

test.beforeEach(async ({ page }) => {
  await preparePage(page);
  const initData = signedInitData();
  await page.addInitScript((value) => {
    const webApp = {
      initData: value,
      platform: "ios",
      ready() {},
      expand() {},
      onEvent() {},
      offEvent() {},
    };
    (window as Window & { Telegram?: { WebApp: typeof webApp } }).Telegram = { WebApp: webApp };
  }, initData);
});

test("owner books, moves and cancels on the CRM copy from an iPhone", async ({ page }) => {
  page.on("dialog", (dialog) => void dialog.accept());
  const response = await page.goto("/telegram/scheduler");
  expect(response?.status()).toBe(200);
  await page.getByTestId("scheduler-new").click();
  await page.getByTestId("scheduler-date").fill("2026-12-23");
  await page.getByTestId("scheduler-client-name").fill("Тест Телефон");
  await page.getByTestId("scheduler-client-phone").fill("48500900900");
  await page.getByTestId("scheduler-confirm-client").check();
  await page.getByTestId("scheduler-make").fill("BMW");
  await page.getByTestId("scheduler-model").fill("X3");
  await page.getByTestId("scheduler-vin").fill("WBAIPHONEVIN0001");
  await page.getByTestId("scheduler-plate").fill("WI 9001");
  await page.getByTestId("scheduler-confirm-vehicle").check();
  await page.getByTestId("scheduler-comment").fill("проверка копии");
  await expect(page.getByText(/Норма/)).toBeVisible();
  await page.getByTestId("scheduler-arrival").fill("09:30");
  await page.getByTestId("scheduler-suggest").click();
  await expect(page.getByTestId("scheduler-notice")).toContainText("Ничего не записано");
  await page.getByTestId("scheduler-start").fill("10:00");
  await page.getByTestId("scheduler-parts").selectOption("available");
  await page.getByTestId("scheduler-book").click();
  await expect(page.getByTestId("scheduler-notice")).toContainText("копии CRM");
  await expect(page.getByTestId("scheduler-reservation")).not.toHaveValue("");
  const version = await page.getByTestId("scheduler-version").inputValue();
  expect(Number(version)).toBeGreaterThan(0);
  await page.getByTestId("scheduler-start").fill("11:00");
  await page.getByTestId("scheduler-move").click();
  await expect(page.getByTestId("scheduler-notice")).toContainText("перенесена");
  await page.getByTestId("scheduler-history").click();
  await expect(page.getByTestId("scheduler-notice")).toContainText("move");
  await page.getByTestId("scheduler-cancel").click();
  await expect(page.getByTestId("scheduler-notice")).toContainText("отменена");
});
