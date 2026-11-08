/** Production stays off until the owner enables the planner after a backup. */
export function smartWorkSchedulerEnabled(): boolean {
  return process.env.SMART_WORK_SCHEDULER === "true";
}

/** Local test ledger only. Preview and production never accept a booking write. */
export function schedulerTestWritesEnabled(): boolean {
  if (!smartWorkSchedulerEnabled()) return false;
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return false;
  return process.env.SCHEDULER_TEST_WRITES === "local";
}

/** CRM appointment rows stay untouched. A later enablement must use the same transaction. */
export function schedulerCrmWritesEnabled(): boolean {
  return false;
}

/** Local screenshot and TEST board only. Never on preview or production. */
export function schedulerTestBoardOpen(): boolean {
  if (!smartWorkSchedulerEnabled()) return false;
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return false;
  return process.env.SCHEDULER_TEST_BOARD === "open";
}
