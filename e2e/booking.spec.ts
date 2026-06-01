import { test, expect } from "@playwright/test";
import { preparePage } from "./helpers";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("booking page — add service to cart and open datetime step", async ({ page }) => {
  await page.goto("/booking");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const addButtons = page.getByRole("button", { name: /Dodaj usługę/i });
  await expect(addButtons.first()).toBeVisible();
  await addButtons.first().click();

  await expect(page.getByText(/W koszyku/i).first()).toBeVisible({ timeout: 5000 });

  await page.getByRole("button", { name: /^Dalej$/i }).click();
  await expect(page.getByText(/termin|godzin|kalendarz/i).first()).toBeVisible({
    timeout: 10_000,
  });
});

test("landing wymiana-oleju opens booking flow from CTA", async ({ page }) => {
  await page.goto("/wymiana-oleju");
  await page.getByRole("button", { name: /Umów wizytę/i }).first().click();
  await expect(page.getByTestId("booking-modal")).toBeVisible({ timeout: 8000 });
});
