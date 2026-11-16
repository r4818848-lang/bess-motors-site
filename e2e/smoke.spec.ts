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

test("optional analytics stay unloaded when consent is denied", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  expect(html).not.toMatch(/mc\.yandex\.ru\/metrika\/tag\.js/);
  expect(html).not.toMatch(/googletagmanager\.com\/gtm\.js/);
  expect(html).not.toMatch(/fbevents\.js/);
});

test("optional analytics load after consent", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bess-cookie-consent", "granted");
  });
  await page.goto("/");
  await expect.poll(async () => page.content()).toMatch(/mc\.yandex\.ru\/metrika\/tag\.js/);
  const html = await page.content();
  expect(html).toMatch(/109683484/);
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

test("homepage does not preload the old ad banner", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const imagePreloads = [...html.matchAll(/<link rel="preload" as="image"[^>]*>/g)].map((m) => m[0]);
  expect(imagePreloads.some((tag) => tag.includes("banner.png"))).toBeFalsy();
  expect(imagePreloads.some((tag) => tag.includes("exterior.png"))).toBeFalsy();
  expect(imagePreloads.some((tag) => tag.includes("tire-audi"))).toBeFalsy();
  expect(html).not.toContain("Orbitron");
  expect(html).not.toMatch(/<link rel="preload" as="image"[^>]*logo\.png/);
  expect(html).toContain("Mechanik samochodowy Warszawa Włochy");
  expect(html).not.toContain("bm-scene-hero");
});

test("tyre landing heading is visible in the first HTML", async ({ request }) => {
  const html = await (await request.get("/wulkanizacja-warszawa")).text();
  expect(html).toContain("Wulkanizacja");
  expect(html).not.toContain("opacity:0");
  expect(html).toContain("tire-audi-q5-bess.jpg");
  expect(html).toContain('id="zapis-opony"');
});

test("saved cookie choice keeps the dialog closed", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  expect(html).not.toContain("cookie-consent-layer");
  expect(html).toContain("data-cookie-dialog");
  expect(html).toContain("We use cookies");
  expect(html).toContain("/fonts/inter-latin.woff2");
  expect(html).toContain("/fonts/inter-polish.woff2");
  expect(html).not.toMatch(/rel="preload"[^>]*inter-cyrillic/);
  await page.goto("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("seo panel and unpublished cases stay private", async ({ page, request }) => {
  const api = await request.get("/api/internal/seo");
  expect(api.status()).toBe(401);
  const body = await api.text();
  expect(body).not.toMatch(/791/);
  const missing = await request.get("/realizacje");
  expect(missing.status()).toBe(404);
  await page.goto("/crm/seo");
  await expect(page.getByRole("heading", { name: "Konto klienta" })).toBeVisible();
  await expect(page.getByText("Logowanie do CRM")).toBeVisible();
});

test("tyre catalog paints the cookie choice in the first HTML", async ({ request }) => {
  const html = await (await request.get("/opony")).text();
  expect(html).toContain("data-cookie-dialog");
  expect(html).toContain("We use cookies");
  const dialogTag = html.match(/<div[^>]*data-cookie-dialog[^>]*>/)?.[0] ?? "";
  expect(dialogTag).not.toContain("backdrop-blur");
});
