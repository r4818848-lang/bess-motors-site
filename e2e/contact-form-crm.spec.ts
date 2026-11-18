import { expect, test } from "@playwright/test";

/** No real customer lead is created: every POST is intercepted in the browser. */
test.describe("Contact form CRM delivery", () => {
  async function fillForm(page: import("@playwright/test").Page) {
    await page.goto("/contacts");
    const form = page.locator("form").filter({ has: page.locator('input[name="clientName"]') });
    await expect(form).toBeVisible();
    await form.locator('input[name="clientName"]').fill("Test Kontakt");
    await form.locator('input[name="phone"]').fill("500600700");
    await form.locator('input[name="email"]').fill("test@example.invalid");
    await form.locator('textarea[name="message"]').fill("Pytanie testowe dotyczące terminu wymiany opon");
    return form;
  }

  test("shows success only after the CRM API confirms the write", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/call-request", async (route) => {
      requests += 1;
      const req = route.request();
      expect(req.method()).toBe("POST");
      const payload = req.postDataJSON();
      expect(payload.source).toBe("contacts_form");
      expect(payload.clientRequestId).toBeTruthy();
      expect(payload.comment).toContain("Pytanie testowe");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, cloud: true }) });
    });
    const form = await fillForm(page);
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[role="status"]')).toBeVisible();
    await expect(form.locator('[role="alert"]')).toHaveCount(0);
    expect(requests).toBe(1);
    await expect(form.locator('input[name="clientName"]')).toHaveValue("");
  });

  test("never shows success when CRM reports a failed save", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/call-request", async (route) => {
      requests += 1;
      await route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ ok: false, error: "cloud_failed" }) });
    });
    const form = await fillForm(page);
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[role="alert"]')).toBeVisible();
    await expect(form.locator('[role="status"]')).toHaveCount(0);
    await expect(form.locator('input[name="clientName"]')).toHaveValue("Test Kontakt");
    expect(requests).toBe(1);
  });
});
