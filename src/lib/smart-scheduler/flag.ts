/** Production stays off until the owner enables the planner after a backup. */
export function smartWorkSchedulerEnabled(): boolean {
  return process.env.SMART_WORK_SCHEDULER === "true";
}
