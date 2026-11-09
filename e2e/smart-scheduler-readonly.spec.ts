import { expect, test } from "@playwright/test";
import { workshopHours } from "../src/lib/businessConfig";
import { syntheticSnapshot } from "../src/lib/smart-scheduler/fixture";
import { preparePage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("read-only calendar shows Сергей and Механик 2", async ({ page, request }) => {
  const snapshot = syntheticSnapshot(new Date("2026-11-09T08:00:00Z"), workshopHours());
  await page.route("**/api/internal/schedule/board**", async (route) => {
    const mode = new URL(route.request().url()).searchParams.get("mode");
    if (mode === "test") {
      await route.fulfill({
        json: {
          ok: true,
          canConfigure: false,
          writable: false,
          message: "TEST. Синтетические автомобили, не записи клиентов.",
          snapshot,
        },
      });
      return;
    }
    await route.fulfill({
      json: {
        ok: true,
        canConfigure: false,
        writable: false,
        message: "Ошибка подключения к CRM. Расписание не загружено. Свободный день не показан.",
        snapshot: { ...snapshot, source: "live", crmConnected: false, appointments: [], crmHolds: [] },
      },
    });
  });

  const response = await page.goto("/telegram/scheduler");
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId("scheduler-filter-mech-1")).toHaveText("Сергей");
  await expect(page.getByTestId("scheduler-filter-mech-2")).toHaveText("Механик 2");
  await expect(page.getByTestId("scheduler-crm-error")).toContainText("Ошибка подключения к CRM");
  await expect(page.getByTestId("scheduler-day-columns")).toHaveCount(0);
  await expect(page.getByTestId("scheduler-new")).toHaveCount(0);
  await expect(page.getByText("имя уточняется")).toHaveCount(0);
  await expect(page.getByText("Piotr Nowak")).toHaveCount(0);
  await expect(page.getByText("Андрей")).toHaveCount(0);

  await page.getByTestId("scheduler-mode-test").click();
  await expect(page.getByTestId("scheduler-column-mech-1").locator("h2")).toHaveText("Сергей");
  await expect(page.getByTestId("scheduler-column-mech-2").locator("h2")).toHaveText("Механик 2");
  const sergey = page.getByTestId("scheduler-card-fix-oil");
  const second = page.getByTestId("scheduler-card-fix-pads");
  await expect(sergey).toContainText("Приезд 11:00");
  await expect(sergey).toContainText("11:00–11:45");
  await expect(sergey).toContainText("lift-1");
  await expect(second).toContainText("Приезд 11:00");
  await expect(second).toContainText("11:20–12:20");
  await expect(second).toContainText("lift-2");
  await expect(page.getByText("имя уточняется")).toHaveCount(0);
  await expect(page.getByText("Piotr Nowak")).toHaveCount(0);
  await expect(page.getByText("Андрей")).toHaveCount(0);

  expect((await request.post("/api/internal/schedule/reservations", { data: {} })).status()).toBe(404);
  expect((await request.put("/api/internal/schedule/settings", { data: {} })).status()).toBe(404);
  expect((await request.post("/api/internal/schedule/approvals", { data: {} })).status()).toBe(404);
});
