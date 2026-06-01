import type { Page } from "@playwright/test";

/** Hide cookie banner so it does not block clicks. */
export async function preparePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("bess-cookie-consent", "denied");
    localStorage.setItem("bess-locale", "pl");
  });
}

/** Admin / mechanic: phone + password on /cabinet (password field = registration plate input). */
export async function loginStaff(
  page: Page,
  phone: string,
  password: string
): Promise<void> {
  await page.goto("/cabinet");
  await page.locator("#bess-client-phone").fill(phone);
  await page.locator("#bess-client-plate").fill(password);
  await page.getByRole("button", { name: /Zaloguj/i }).click();
  await page.waitForURL(/\/(crm|mechanic)/, { timeout: 25_000 });
}

export function staffCredentials(): { phone: string; password: string } | null {
  const phone = process.env.E2E_ADMIN_PHONE?.trim();
  const password = process.env.E2E_ADMIN_PASSWORD?.trim();
  if (!phone || !password) return null;
  return { phone, password };
}
