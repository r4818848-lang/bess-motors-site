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


test("homepage provides four immediate customer actions and six service links", async ({ page }) => {
  await page.goto("/");
  const actions = page.getByTestId("hero-quick-actions");
  await expect(actions.locator("a")).toHaveCount(4);
  await expect(actions.locator('a[href="/booking"]')).toBeVisible();
  await expect(actions.locator('a[href^="tel:"]')).toBeVisible();
  await expect(actions.locator('a[href="#wyceń-po-vin"]')).toBeVisible();
  await expect(actions.locator('a[href="/services"]')).toBeVisible();
  const services = page.getByTestId("services-visual-grid");
  await expect(services.getByTestId("visual-service-card")).toHaveCount(6);
  for (const href of ["/wymiana-oleju", "/wymiana-opon-warszawa", "/hamulce", "/klimatyzacja", "/diagnostyka-komputerowa-warszawa", "/naprawa-zawieszenia-warszawa"]) {
    await expect(services.locator('a[href="' + href + '"]')).toBeVisible();
  }
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


test("mobile tyre page prioritizes booking above the large photo", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/wymiana-opon-warszawa");
  expect(response?.ok()).toBeTruthy();
  const action = page.getByTestId("service-hero-book");
  const photo = page.getByTestId("service-landing-hero-media");
  await expect(action).toBeVisible();
  await expect(photo).toBeVisible();
  const [buttonBox, photoBox] = await Promise.all([action.boundingBox(), photo.boundingBox()]);
  expect(buttonBox && photoBox && buttonBox.y < photoBox.y).toBeTruthy();
});



test("approved three BMWs remain uncropped on phone and desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const hero = page.getByTestId("home-hero");
  await expect(hero).toHaveAttribute("data-hero-layout", "full-bleed");
  const media = page.getByTestId("hero-background-film");
  await expect(media).toHaveAttribute("data-cars-visible", "three");
  await expect(hero.locator('[data-hero-background="true"]')).toHaveCount(1);
  await expect(hero.locator('video[poster="/images/bess-motors-hero-poster.webp"]')).toHaveCount(1);
  const image = media.locator("img");
  const video = media.locator("video");
  await expect.poll(() => image.evaluate(el => getComputedStyle(el).objectFit)).toBe("contain");
  await expect.poll(() => video.evaluate(el => getComputedStyle(el).objectFit)).toBe("contain");

  for (const width of [360, 390, 428, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const box = await media.boundingBox();
    expect(box && box.width > width * (width >= 1024 ? 0.5 : 0.9)).toBeTruthy();
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete ? el.naturalWidth : 0)).toBeGreaterThan(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, "overflow at " + width).toBeLessThanOrEqual(1);
  }
});

test("BESS 3.0 portfolio shows real before and after work photos", async ({ page }) => {
  await page.goto("/");
  const cases = page.getByTestId("home-case-studies");
  await expect(cases).toBeVisible();
  await expect(cases.getByTestId("work-case-card")).toHaveCount(2);
  const photos = cases.getByTestId("work-case-card").first().locator("img");
  await expect(photos).toHaveCount(2);
  await photos.first().scrollIntoViewIfNeeded();
  await expect.poll(
    () => photos.first().evaluate((img: HTMLImageElement) => img.complete ? img.naturalWidth : 0),
    { timeout: 20000 },
  ).toBeGreaterThan(0);
  await expect(cases.locator('a[href="/gallery?tab=repairs"]').first()).toBeVisible();
});

test("portfolio repairs tab has usable before-after images and expandable detail", async ({ page }) => {
  await page.goto("/gallery?tab=repairs");
  const cases = page.getByTestId("repair-portfolio-case");
  await expect(cases.first()).toBeVisible();
  const comparison = cases.first().getByTestId("before-after-comparison");
  await expect(comparison.locator("img")).toHaveCount(2);
  const detail = cases.first().locator("details");
  await expect(detail).toHaveCount(1);
  await detail.locator("summary").click();
  await expect(detail).toHaveAttribute("open", "");
  await cases.first().getByTestId("before-after-comparison").locator("button").first().click();
  await expect(page.getByRole("dialog", { name: /Wymiana|Замена|Brake/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /Wymiana|Замена|Brake/i })).toHaveCount(0);
});

test("booking includes quick service paths and retains existing booking flow", async ({ page }) => {
  await page.goto("/booking");
  const quickStart = page.getByTestId("booking-quick-start");
  await expect(quickStart).toBeVisible();
  await expect(quickStart.locator('a[href*="items=oil_filter"]').first()).toBeVisible();
  await expect(quickStart.locator('a[href*="items=brake_pads_front"]').first()).toBeVisible();
  await expect(quickStart.locator('a[href*="/sezonowa-wymiana-opon-warszawa"]').first()).toBeVisible();
  await expect(page.getByTestId("booking-quote-flow")).toBeVisible();
  const steps = page.getByTestId("booking-quote-flow").locator('ol[aria-label]');
  await expect(steps.locator("li")).toHaveCount(3);
});

test("service process uses readable cards rather than horizontal scrolling table", async ({ page }) => {
  await page.goto("/wymiana-opon-warszawa");
  const steps = page.getByTestId("service-process-steps");
  await expect(steps).toBeVisible();
  await expect(steps.locator("li").first()).toBeVisible();
  await expect(steps.locator("table")).toHaveCount(0);
});

test("new homepage remains usable at small mobile widths", async ({ page }) => {
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 840 });
    await page.goto("/");
    await expect(page.getByTestId("home-hero").locator('a[href="/booking"]').first()).toBeVisible();
    await expect(page.getByTestId("home-hero").locator('a[href="/services"]').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "horizontal overflow at " + width).toBeLessThanOrEqual(1);
  }
});

test("desktop header becomes compact after scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.locator('[data-site-header] > div > div').first();
  const initial = (await header.boundingBox())?.height ?? 0;
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await expect.poll(async () => (await header.boundingBox())?.height ?? 0).toBeLessThan(initial);
});



test("BESS hero matches the approved premium automotive design", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByTestId("home-hero");
  await expect(hero).toHaveAttribute("data-hero-design", "automotive-showcase-2026");
  await expect(hero.getByRole("heading", { level: 1 })).toContainText("Mechanik samochodowy Warszawa Włochy");
  const headline = hero.getByTestId("hero-editorial-headline");
  await expect(headline).toContainText("Kompleksowy serwis");
  await expect(headline).toContainText("Twojego samochodu.");
  await expect(headline).toContainText("Szybko i bez stresu.");
  await expect(hero.getByTestId("hero-quick-actions").locator("a")).toHaveCount(4);
  const nextSection = await hero.evaluate(section => section.nextElementSibling?.getAttribute("aria-labelledby"));
  expect(nextSection).toBe("popular-services-heading");
  await expect(page.getByTestId("home-trust-summary")).toBeVisible();
  await expect(page.getByTestId("home-google-ribbon")).toBeVisible();
  await expect(page.getByText("Ponad 500 opinii w Google")).toHaveCount(0);
});


test("mobile homepage has four large actions and app-like five-item navigation", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/");
  const hero = page.getByTestId("home-hero");
  await expect(hero.getByTestId("hero-editorial-headline")).toBeVisible();
  await expect(hero.getByTestId("hero-quick-actions").locator("a")).toHaveCount(4);
  const bar = page.getByTestId("mobile-action-bar");
  await expect(bar).toBeVisible();
  await expect(bar.locator('a[href="/"]')).toBeVisible();
  await expect(bar.locator('a[href="/services"]')).toBeVisible();
  await expect(bar.locator('a[href="/booking"]')).toBeVisible();
  await expect(bar.locator('a[href="/cennik"]')).toBeVisible();
  await bar.getByTestId("mobile-bottom-menu").click();
  await expect(page.getByTestId("nav-overlay")).toBeVisible();
  await page.getByTestId("close-nav").click();
  await expect(page.getByTestId("nav-overlay")).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("automotive headline uses a distinct condensed display face while the body stays readable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const headline = page.getByTestId("hero-editorial-headline");
  await expect(headline).toBeVisible();
  const typography = await page.evaluate(() => {
    const title = document.querySelector('[data-testid="hero-editorial-headline"]');
    if (!title) return null;
    const heading = getComputedStyle(title);
    const body = getComputedStyle(document.body);
    return {
      titleFamily: heading.fontFamily,
      bodyFamily: body.fontFamily,
      titleWeight: Number(heading.fontWeight),
      text: title.textContent,
    };
  });
  expect(typography).not.toBeNull();
  expect(typography?.titleFamily).toMatch(/Roboto[_ ]Condensed/i);
  expect(typography?.bodyFamily).toMatch(/Inter/i);
  expect(typography?.titleWeight).toBeLessThanOrEqual(750);
  expect(typography?.text).toContain("Szybko i bez stresu.");

  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 840 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "new condensed font overflow at " + width).toBeLessThanOrEqual(1);
    await expect(headline).toBeVisible();
  }
});


test("public site brand palette unifies primary, secondary and accent controls", async ({ page }) => {
  await page.goto("/");
  const root = page.locator(".bm-public");
  await expect(root).toHaveCount(1);
  const tokens = await root.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      primary: style.getPropertyValue("--bm-primary").trim(),
      hover: style.getPropertyValue("--bm-primary-hover").trim(),
      accent: style.getPropertyValue("--bm-accent").trim(),
      text: style.getPropertyValue("--bm-copy").trim(),
    };
  });
  expect(tokens).toEqual({
    primary: "#e10600",
    hover: "#c90a05",
    accent: "#ff625c",
    text: "#c9d1d9",
  });

  const hero = page.getByTestId("home-hero");
  const primary = hero.locator(".bm-btn-primary").first();
  const secondary = hero.locator(".bm-btn-secondary").first();
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();
  const getBg = async (locator: typeof primary) =>
    locator.evaluate((element) => getComputedStyle(element).backgroundColor);
  const getText = async (locator: typeof primary) =>
    locator.evaluate((element) => getComputedStyle(element).color);

  await expect.poll(() => getBg(primary)).toBe("rgb(225, 6, 0)");
  await expect.poll(() => getText(primary)).toBe("rgb(255, 255, 255)");
  await expect.poll(() => getText(secondary)).toBe("rgb(248, 250, 252)");
  await primary.hover();
  await expect.poll(() => getBg(primary)).toBe("rgb(201, 10, 5)");

  const accent = hero.locator(".text-bm-accent").first();
  await expect.poll(() => getText(accent)).toBe("rgb(255, 98, 92)");

  await page.goto("/wymiana-opon-warszawa");
  const landingBook = page.getByTestId("service-hero-book");
  await expect(landingBook).toBeVisible();
  await expect.poll(() => getBg(landingBook)).toBe("rgb(225, 6, 0)");

  await page.goto("/services");
  const catalogueBook = page.getByTestId("service-catalogue").locator(".bm-btn-primary").first();
  await expect(catalogueBook).toBeVisible();
  await expect.poll(() => getBg(catalogueBook)).toBe("rgb(225, 6, 0)");
});


test("all 13 customization SEO pages resolve with distinct metadata and no invented prices or images", async ({ page }) => {
  const slugs = [
    "personalizacja-samochodu-warszawa",
    "oswietlenie-ambientowe-samochodu-warszawa",
    "obszywanie-kierownicy-warszawa",
    "obszywanie-foteli-samochodowych-warszawa",
    "obszywanie-podsufitki-samochodowej-warszawa",
    "obszywanie-boczkow-drzwi-warszawa",
    "montaz-body-kitu-warszawa",
    "montaz-spoilera-samochodowego-warszawa",
    "montaz-splittera-warszawa",
    "aromatyzacja-samochodu-warszawa",
    "montaz-apple-carplay-warszawa",
    "oklejanie-samochodu-folia-warszawa",
    "pranie-tapicerki-samochodowej-warszawa",
  ];
  const titles = new Set<string>();
  for (const slug of slugs) {
    const response = await page.goto("/" + slug);
    expect(response?.status(), slug).toBe(200);
    const h1 = page.locator("main h1");
    await expect(h1, slug).toHaveCount(1);
    const title = await page.title();
    expect(title, slug).toContain("Warszawa");
    expect(titles.has(title), "duplicate SEO title for " + slug).toBe(false);
    titles.add(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp("/" + slug + "$"));
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/i);
    await expect(page.locator('main [data-testid="enhancement-service-page"] img')).toHaveCount(0);
  }
  await page.goto("/oswietlenie-ambientowe-samochodu-warszawa");
  await expect(page.getByTestId("enhancement-quote")).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((text) => text.includes('"@type":"Service"'))).toBe(true);
  expect(ld.join(" ")).not.toContain('"priceCurrency"');
  expect(ld.join(" ")).not.toContain('"offers"');
});

test("customization category is discoverable in catalogue and multilingual service search", async ({ page }) => {
  await page.goto("/services");
  const category = page.getByRole("button", { name: "Personalizacja", exact: true });
  await category.click();
  const area = page.getByTestId("services-customization");
  await expect(area).toBeVisible();
  await expect(area.getByTestId("customization-catalog-card")).toHaveCount(12);
  await page.getByTestId("catalogue-search").fill("CarPlay");
  await expect(area.getByTestId("customization-catalog-card")).toHaveCount(1);
  await expect(area.locator('a[href="/montaz-apple-carplay-warszawa"]')).toBeVisible();
  await page.getByTestId("header-service-search").click();
  await page.getByTestId("service-finder-input").fill("obszywanie kierownicy");
  const results = page.getByTestId("enhancement-search-result");
  await expect(results).toHaveCount(1);
  await expect(results.first()).toHaveAttribute("href", "/obszywanie-kierownicy-warszawa");
});

test("new customization hub is present in sitemap and links from homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href="/personalizacja-samochodu-warszawa"]').first()).toBeVisible();
  const response = await page.request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();
  const xml = await response.text();
  for (const slug of ["personalizacja-samochodu-warszawa", "oswietlenie-ambientowe-samochodu-warszawa", "montaz-apple-carplay-warszawa", "pranie-tapicerki-samochodowej-warszawa"]) {
    expect(xml).toContain("/" + slug);
  }
});
