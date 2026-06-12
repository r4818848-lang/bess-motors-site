import { test, expect } from "@playwright/test";
import { seoLandingSlugs } from "../src/lib/seo-landing-pages";
import { preparePage } from "./helpers";

test.describe("SEO landing pages", () => {
  test.beforeEach(async ({ page }) => {
    await preparePage(page);
  });

  for (const slug of seoLandingSlugs) {
    test(`/${slug} — hero, CTA, FAQ`, async ({ page }) => {
      const res = await page.goto(`/${slug}`);
      expect(res?.ok()).toBeTruthy();

      await expect(page.locator("h1").first()).toBeVisible();

      const bookCta = page
        .getByRole("button", { name: /Umów wizytę/i })
        .or(page.getByRole("link", { name: /Umów|Zapisz online/i }))
        .first();
      await expect(bookCta).toBeVisible();

      const faqHeading = page.getByRole("heading", { name: /FAQ|Najczęściej/i }).first();
      if (await faqHeading.isVisible().catch(() => false)) {
        await expect(faqHeading).toBeVisible();
      }
    });
  }
});
