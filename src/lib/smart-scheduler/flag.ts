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

/** Production routes stay on the old calendar. The SQL switch is default off and is not read here. */
export function schedulerUnifiedCalendarWired(): boolean {
  return false;
}

/**
 * Process-level confirmation that the SQL switch is the writer.
 * When this is on and the transactional database cannot be reached, calendar writes return 503
 * instead of falling through to the old two-step save. Vercel never activates it.
 * Production does not set this variable.
 */
export function schedulerUnifiedModeRequired(): boolean {
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return false;
  return process.env.SCHEDULER_UNIFIED_CALENDAR === "on";
}

/** The scheduler page can render. The read-only pilot does not enable writes. */
export function schedulerPageOpen(): boolean {
  return smartWorkSchedulerEnabled() || schedulerReadOnlyPilotEnabled();
}

/** View the schedule without a write grant. Off unless a local pilot sets it. It never enables writes. Vercel stays closed. */
export function schedulerReadOnlyPilotEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return false;
  return process.env.SCHEDULER_READ_ONLY_PILOT === "local";
}

/** Local screenshot and TEST board only. Never on preview or production. */
export function schedulerTestBoardOpen(): boolean {
  if (!smartWorkSchedulerEnabled()) return false;
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return false;
  return process.env.SCHEDULER_TEST_BOARD === "open";
}
