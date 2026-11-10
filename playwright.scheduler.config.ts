import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const copyUrl = process.env.SCHEDULER_CRM_COPY_URL || "postgresql://ubuntu@/bess_crm_copy_test?host=/var/run/postgresql";

/** Owner write against the local CRM copy. Production flags stay unset. */
export default defineConfig({
  testDir: "e2e",
  testMatch: /smart-scheduler-owner\.spec\.ts/,
  forbidOnly: isCI,
  retries: 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "on-failure" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://127.0.0.1:3012",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "ru-RU",
  },
  projects: [
    {
      name: "iphone",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: {
    command: [
      "env",
      "-u", "SMART_WORK_SCHEDULER",
      "-u", "SCHEDULER_UNIFIED_CALENDAR",
      "-u", "SCHEDULER_TEST_WRITES",
      "-u", "SCHEDULER_READ_ONLY_PILOT",
      "-u", "VERCEL_ENV",
      "SCHEDULER_OWNER_WRITE_PILOT=local",
      "TELEGRAM_BOT_TOKEN=123456:scheduler-owner-e2e",
      "TELEGRAM_CHAT_ID=77",
      `SCHEDULER_CRM_COPY_URL=${copyUrl}`,
      isCI ? "npm run start -- -p 3012 -H 127.0.0.1" : "npx next dev -p 3012 -H 127.0.0.1",
    ].join(" "),
    url: "http://127.0.0.1:3012/telegram/scheduler",
    reuseExistingServer: false,
    timeout: isCI ? 180_000 : 120_000,
  },
});
