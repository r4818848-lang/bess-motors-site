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

test("homepage preloads the approved hero poster, not the legacy banner", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const imagePreloads = [...html.matchAll(/<link rel="preload" as="image"[^>]*>/g)].map((m) => m[0]);
  expect(imagePreloads.some((tag) => tag.includes("bess-motors-hero-poster.webp"))).toBeTruthy();
  expect(imagePreloads.some((tag) => tag.includes("banner.png"))).toBeFalsy();
  expect(imagePreloads.some((tag) => tag.includes("exterior.png"))).toBeFalsy();
  expect(imagePreloads.some((tag) => tag.includes("tire-audi"))).toBeFalsy();
  expect(html).not.toContain("Orbitron");
  expect(html).not.toMatch(/<link rel="preload" as="image"[^>]*logo\.png/);
});

test("approved homepage film has its static assets and accessible poster", async ({ page, request }) => {
  await page.goto("/");
  const video = page.locator('video[poster="/images/bess-motors-hero-poster.webp"]');
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).toHaveAttribute("loop", "");
  const [film, poster] = await Promise.all([
    request.get("/videos/bess-motors-hero-2026.mp4"),
    request.get("/images/bess-motors-hero-poster.webp"),
  ]);
  expect(film.status()).toBe(200);
  expect(film.headers()["content-type"]).toContain("video/mp4");
  expect(poster.status()).toBe(200);
  expect(poster.headers()["content-type"]).toContain("image/webp");
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

// SEO/CRO sprint: keep strong organic service URLs visible and canonicalized.
test("homepage premium cards link to primary tyre, oil and brake landings", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#popular-services-heading")).toBeVisible();
  await expect(page.locator('a[href="/wymiana-opon-warszawa"]').first()).toBeVisible();
  await expect(page.locator('a[href="/wymiana-oleju"]').first()).toBeVisible();
  await expect(page.locator('a[href="/hamulce"]').first()).toBeVisible();
});

test("legacy oil landing shares the canonical URL of the primary oil page", async ({ request }) => {
  const [main, alternate] = await Promise.all([
    request.get("/wymiana-oleju"),
    request.get("/wymiana-oleju-warszawa"),
  ]);
  expect(main.ok()).toBeTruthy();
  expect(alternate.ok()).toBeTruthy();
  const extractCanonical = (html: string) =>
    html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const primaryCanonical = extractCanonical(await main.text());
  const alternateCanonical = extractCanonical(await alternate.text());
  expect(primaryCanonical).toMatch(/\/wymiana-oleju$/);
  expect(alternateCanonical).toBe(primaryCanonical);
});

test("high-intent service descriptions stay concise and location-specific", async ({ request }) => {
  for (const path of ["/wymiana-opon-warszawa", "/wymiana-oleju", "/hamulce", "/zawieszenie"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBeTruthy();
    const html = await response.text();
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
    expect(description.length, path).toBeGreaterThan(70);
    expect(description.length, path).toBeLessThanOrEqual(160);
    expect(description, path).toMatch(/Warszawa/);
  }
});
