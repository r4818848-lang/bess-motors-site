import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

/** Read-only page only. Write flags stay unset, and this server does not replace the default suite. */
export default defineConfig({
  testDir: "e2e",
  testMatch: /smart-scheduler-readonly\.spec\.ts/,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "on-failure" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:3011",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "pl-PL",
  },
  projects: [
    {
      name: "iphone",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: {
    command: isCI
      ? "env -u SMART_WORK_SCHEDULER -u SCHEDULER_UNIFIED_CALENDAR -u SCHEDULER_TEST_WRITES SCHEDULER_READ_ONLY_PILOT=local npm run start -- -p 3011 -H 127.0.0.1"
      : "env -u SMART_WORK_SCHEDULER -u SCHEDULER_UNIFIED_CALENDAR -u SCHEDULER_TEST_WRITES SCHEDULER_READ_ONLY_PILOT=local npx next dev -p 3011 -H 127.0.0.1",
    url: "http://127.0.0.1:3011/telegram/scheduler",
    reuseExistingServer: false,
    timeout: isCI ? 180_000 : 120_000,
  },
});
