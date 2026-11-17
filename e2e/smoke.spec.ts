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
  const services = page.locator('section[aria-labelledby="popular-services-heading"]');
  await expect(services.locator("#popular-services-heading")).toBeVisible();
  await expect(services.locator('a[href="/wymiana-opon-warszawa"]')).toBeVisible();
  await expect(services.locator('a[href="/wymiana-oleju"]')).toBeVisible();
  await expect(services.locator('a[href="/hamulce"]')).toBeVisible();
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


test("redesigned service finder filters by service and closes on Escape", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("header-service-search").click();
  const panel = page.getByTestId("nav-overlay");
  await expect(panel).toBeVisible();
  const input = page.getByTestId("service-finder-input");
  await expect(input).toBeFocused();
  await input.fill("hamulce");
  await expect(panel.locator('a[href="/hamulce"]')).toBeVisible();
  await expect(panel.locator('a[href="/wymiana-opon-warszawa"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
});

test("mobile navigation searches Polish and Russian symptoms and exposes booking", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByTestId("mobile-action-bar")).toBeVisible();
  await expect(page.getByTestId("mobile-action-bar").locator('a[href="/booking"]')).toBeVisible();
  await page.getByTestId("mobile-nav-toggle").click();
  const input = page.getByTestId("service-finder-input");
  await expect(input).toBeFocused();
  await input.fill("масло");
  await expect(page.getByTestId("nav-overlay").locator('a[href="/wymiana-oleju"]')).toBeVisible();
  await input.fill("stuki");
  await expect(page.getByTestId("nav-overlay").locator('a[href="/naprawa-zawieszenia-warszawa"]')).toBeVisible();
  await page.getByTestId("close-nav").click();
  await expect(page.getByTestId("nav-overlay")).toHaveCount(0);
});

test("homepage provides four easy paths into the workshop", async ({ page }) => {
  await page.goto("/");
  const shortcuts = page.locator('section[aria-labelledby="home-quick-choices"]');
  await expect(shortcuts.locator('a[href="/services"]')).toBeVisible();
  await expect(shortcuts.locator('a[href="#objawy"]')).toBeVisible();
  await expect(shortcuts.locator('a[href="/cennik"]')).toBeVisible();
  await expect(shortcuts.locator('a[href="/booking"]')).toBeVisible();
  await expect(page.locator("#objawy")).toHaveCount(1);
});


test("service catalogue lets visitors filter repairs without a long unstructured list", async ({ page }) => {
  await page.goto("/services");
  const catalog = page.getByTestId("service-catalogue");
  await expect(catalog).toBeVisible();
  const search = page.getByTestId("catalogue-search");
  await search.fill("dsg");
  await expect(catalog.getByTestId("service-result")).toHaveCount(1);
  await expect(catalog.locator('a[href="/wymiana-oleju-skrzynia-automatyczna-warszawa"]')).toBeVisible();
  await search.fill("");
  await catalog.locator('button[aria-pressed="false"]').filter({ hasText: /Naprawy|Ремонт|Mechanical/i }).first().click();
  await expect(catalog.locator('article[data-testid="service-result"] a[href="/wymiana-rozrzadu-warszawa"]')).toBeVisible();
  await expect(catalog.locator('article[data-testid="service-result"] a[href="/wymiana-opon-warszawa"]')).toHaveCount(0);
});


test("service landing photos load successfully instead of displaying broken placeholders", async ({ page }) => {
  for (const path of ["/wymiana-opon-warszawa", "/wymiana-oleju", "/hamulce"]) {
    const response = await page.goto(path);
    expect(response?.ok(), path).toBeTruthy();
    const media = page.getByTestId("service-landing-hero-media");
    await expect(media, path).toBeVisible();
    await expect(page.getByTestId("service-hero-book"), path).toBeVisible();
    const heroPhoto = media.locator("img");
    await expect.poll(
      () => heroPhoto.evaluate((img: HTMLImageElement) => img.complete ? img.naturalWidth : 0),
      { timeout: 20000, message: path + " hero image is missing or failed to decode" },
    ).toBeGreaterThan(0);

    const gallery = page.locator('section[aria-labelledby="landing-photos-hero-heading"]');
    await expect(gallery, path).toBeVisible();
    const galleryPhoto = gallery.locator("img").first();
    await galleryPhoto.scrollIntoViewIfNeeded();
    await expect.poll(
      () => galleryPhoto.evaluate((img: HTMLImageElement) => img.complete ? img.naturalWidth : 0),
      { timeout: 20000, message: path + " work photo is missing or cannot be optimized" },
    ).toBeGreaterThan(0);
    await expect(galleryPhoto).not.toHaveAttribute("src", /[?&]q=55(?:&|$)/);
  }
});
