import { expect, test, type Page } from "@playwright/test";
import { preparePage } from "./helpers";

type Insets = { top: number; right: number; bottom: number; left: number };

type Profile = {
  name: string;
  width: number;
  height: number;
  safe: Insets;
  content: Insets;
  stable: number;
  current: number;
  paddingTop: number;
};

const zero = { top: 0, right: 0, bottom: 0, left: 0 };

const profiles: Profile[] = [
  {
    name: "dynamic-island",
    width: 393,
    height: 852,
    safe: { top: 59, right: 0, bottom: 34, left: 0 },
    content: { top: 46, right: 0, bottom: 0, left: 0 },
    stable: 700,
    current: 700,
    paddingTop: 113,
  },
  {
    name: "notch",
    width: 390,
    height: 844,
    safe: { top: 47, right: 0, bottom: 34, left: 0 },
    content: { top: 46, right: 0, bottom: 0, left: 0 },
    stable: 680,
    current: 680,
    paddingTop: 101,
  },
  {
    name: "no-notch",
    width: 375,
    height: 667,
    safe: { top: 20, right: 0, bottom: 0, left: 0 },
    content: { top: 46, right: 0, bottom: 0, left: 0 },
    stable: 620,
    current: 620,
    paddingTop: 74,
  },
  {
    name: "android",
    width: 360,
    height: 800,
    safe: { top: 24, right: 0, bottom: 0, left: 0 },
    content: zero,
    stable: 760,
    current: 760,
    paddingTop: 32,
  },
  {
    name: "narrow",
    width: 320,
    height: 568,
    safe: { top: 20, right: 0, bottom: 0, left: 0 },
    content: { top: 46, right: 0, bottom: 0, left: 0 },
    stable: 520,
    current: 520,
    paddingTop: 74,
  },
  {
    name: "wide",
    width: 430,
    height: 932,
    safe: { top: 59, right: 0, bottom: 34, left: 0 },
    content: { top: 46, right: 0, bottom: 0, left: 0 },
    stable: 780,
    current: 780,
    paddingTop: 113,
  },
  {
    name: "telegram-desktop",
    width: 1280,
    height: 800,
    safe: zero,
    content: zero,
    stable: 800,
    current: 800,
    paddingTop: 8,
  },
];

async function installTelegram(page: Page, profile: Profile) {
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) => route.abort());
  await page.addInitScript((input) => {
    const listeners: Record<string, Array<() => void>> = {};
    const webApp = {
      initData: "auth_date=1&hash=00",
      platform: input.name === "telegram-desktop" ? "tdesktop" : input.name === "android" ? "android" : "ios",
      initDataUnsafe: { user: { language_code: "ru" } },
      safeAreaInset: input.safe,
      contentSafeAreaInset: input.content,
      viewportHeight: input.current,
      viewportStableHeight: input.stable,
      readyCalls: 0,
      expandCalls: 0,
      ready() {
        webApp.readyCalls += 1;
      },
      expand() {
        webApp.expandCalls += 1;
      },
      onEvent(name: string, callback: () => void) {
        listeners[name] = [...(listeners[name] ?? []), callback];
      },
      offEvent(name: string, callback: () => void) {
        listeners[name] = (listeners[name] ?? []).filter((item) => item !== callback);
      },
      emit(name: string) {
        for (const callback of listeners[name] ?? []) callback();
      },
    };
    (window as Window & { Telegram?: { WebApp: typeof webApp } }).Telegram = { WebApp: webApp };
  }, profile);
}

async function mockCalendar(page: Page, appointments: unknown[]) {
  await page.route("**/api/staff/calendar", async (route) => {
    const body = route.request().postDataJSON() as { action?: string };
    if (body.action === "session") {
      await route.fulfill({
        json: {
          ok: true,
          role: "owner",
          canEdit: true,
          today: "2026-11-09",
          mechanics: [{ id: "m1", name: "A" }],
        },
      });
      return;
    }
    if (body.action === "list") {
      await route.fulfill({ json: { ok: true, appointments } });
      return;
    }
    await route.fulfill({ json: { ok: true } });
  });
}

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

for (const profile of profiles) {
  test(`calendar stays under the Telegram header on ${profile.name}`, async ({ page }) => {
    await installTelegram(page, profile);
    await mockCalendar(page, []);
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.goto("/telegram/calendar");
    const shell = page.getByTestId("telegram-calendar-shell");
    await expect(shell).toBeVisible();
    await expect(page.getByRole("heading", { name: "2026-11-09" })).toBeVisible();
    const paddingTop = await shell.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingTop));
    expect(paddingTop).toBe(profile.paddingTop);
    const minHeight = await shell.evaluate((element) => getComputedStyle(element).minHeight);
    expect(minHeight).toBe(`${profile.stable}px`);
    const titleTop = await shell.evaluate((element) => {
      const title = Array.from(element.querySelectorAll("p")).find((node) => node.textContent === "BESS MOTORS");
      return title?.getBoundingClientRect().top ?? 0;
    });
    expect(titleTop).toBeGreaterThanOrEqual(profile.paddingTop - 1);
    for (const tab of ["today", "week", "month", "add"]) {
      const box = await page.getByTestId(`telegram-tab-${tab}`).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.y ?? 0).toBeGreaterThanOrEqual(profile.paddingTop);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(profile.width + 1);
    }
    const archive = await page.getByTestId("telegram-calendar-archive").boundingBox();
    expect(archive?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expect(page.getByTestId("telegram-calendar-empty")).toContainText("На сегодня записей нет");
    await expect(page.getByTestId("telegram-calendar-new")).toBeVisible();
    const metrics = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);
    const calls = await page.evaluate(() => {
      const webApp = (window as Window & { Telegram?: { WebApp?: { readyCalls?: number; expandCalls?: number } } }).Telegram?.WebApp;
      return { ready: webApp?.readyCalls ?? 0, expand: webApp?.expandCalls ?? 0 };
    });
    expect(calls.ready).toBeGreaterThan(0);
    expect(calls.expand).toBeGreaterThan(0);
  });
}

test("an empty day offers one new visit and the form fits a 320px screen", async ({ page }) => {
  const profile = profiles.find((item) => item.name === "narrow")!;
  await installTelegram(page, profile);
  await mockCalendar(page, []);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/telegram/calendar");
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).toContain("viewport-fit=cover");
  await page.getByTestId("telegram-calendar-new").click();
  const name = page.getByPlaceholder("Имя");
  await expect(name).toBeVisible();
  const box = await name.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(321);
  const metrics = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);
});

test("move and delete stay large enough to tap", async ({ page }) => {
  const profile = profiles.find((item) => item.name === "notch")!;
  await installTelegram(page, profile);
  await mockCalendar(page, [{
    id: "a1",
    date: "2026-11-09",
    time: "09:00",
    clientName: "Jan",
    clientPhone: "+48000000000",
    make: "Audi",
    model: "A4",
    plate: "WX1",
    problemText: "olej",
    mechanicId: "m1",
    mechanicName: "A",
    visitState: "expected",
    appointmentStatus: "confirmed",
    serviceIds: [],
    leavesCar: false,
    pickupDate: "",
    updatedAt: "2026-11-09T08:00:00.000Z",
  }]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/telegram/calendar");
  await expect(page.getByTestId("telegram-calendar-empty")).toHaveCount(0);
  await page.getByRole("button", { name: /09:00/ }).click();
  for (const id of ["telegram-move", "telegram-remove"]) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test("the keyboard shrinks the shell to the current viewport", async ({ page }) => {
  const profile = profiles.find((item) => item.name === "dynamic-island")!;
  await installTelegram(page, profile);
  await mockCalendar(page, []);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/telegram/calendar");
  const shell = page.getByTestId("telegram-calendar-shell");
  await expect(shell).toBeVisible();
  await page.evaluate(() => {
    const webApp = (window as Window & {
      Telegram?: { WebApp?: { viewportHeight: number; emit: (name: string) => void } };
    }).Telegram?.WebApp;
    if (!webApp) return;
    webApp.viewportHeight = 400;
    webApp.emit("viewportChanged");
  });
  await expect.poll(async () => shell.evaluate((element) => getComputedStyle(element).maxHeight)).toBe("400px");
  const minHeight = await shell.evaluate((element) => getComputedStyle(element).minHeight);
  expect(minHeight).toBe("400px");
  const paddingTop = await shell.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingTop));
  expect(paddingTop).toBe(113);
});
