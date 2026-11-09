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

/**
 * Local owner-only write door. It does not turn on CRM writes, the unified
 * calendar, or test writes. Production and preview ignore the variable.
 * The read-only pilot wins, so a viewing deployment cannot start saving.
 */
export function schedulerOwnerWritePilotEnabled(): boolean {
  if (process.env.SCHEDULER_OWNER_WRITE_PILOT !== "local") return false;
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return false;
  if (schedulerReadOnlyPilotEnabled()) return false;
  return true;
}

/** The scheduler page can render. The read-only pilot does not enable writes. */
export function schedulerPageOpen(): boolean {
  return smartWorkSchedulerEnabled() || schedulerReadOnlyPilotEnabled() || schedulerOwnerWritePilotEnabled();
}

/**
 * Staff-only, read-only calendar gate. Default is closed on every deployment.
 * The production opt-in is separate from SMART_WORK_SCHEDULER and all write switches.
 * Preview never opens. No migration or scheduler DB role is required for reads.
 */
export function schedulerReadOnlyPilotEnabled(): boolean {
  const mode = process.env.SCHEDULER_READ_ONLY_PILOT;
  const environment = process.env.VERCEL_ENV;
  if (mode === "local") return environment !== "production" && environment !== "preview";
  if (mode !== "production-readonly" || environment !== "production") return false;
  return !smartWorkSchedulerEnabled()
    && process.env.SCHEDULER_UNIFIED_CALENDAR !== "on"
    && !process.env.SCHEDULER_TEST_WRITES
    && process.env.SCHEDULER_CRM_SOURCE === "cloud";
}

/** Local screenshot and TEST board only. Never on preview or production. */
export function schedulerTestBoardOpen(): boolean {
  if (!smartWorkSchedulerEnabled()) return false;
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return false;
  return process.env.SCHEDULER_TEST_BOARD === "open";
}
