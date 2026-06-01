/** Blocks cloud pull while CRM create/edit draft is open (prevents losing unsaved data). */
const COUNT_KEY = "bess-crm-draft-count";

export function acquireCrmDraftLock(): void {
  if (typeof window === "undefined") return;
  const n = Number.parseInt(sessionStorage.getItem(COUNT_KEY) ?? "0", 10) + 1;
  sessionStorage.setItem(COUNT_KEY, String(n));
}

export function releaseCrmDraftLock(): void {
  if (typeof window === "undefined") return;
  const n = Math.max(0, Number.parseInt(sessionStorage.getItem(COUNT_KEY) ?? "0", 10) - 1);
  if (n <= 0) sessionStorage.removeItem(COUNT_KEY);
  else sessionStorage.setItem(COUNT_KEY, String(n));
}

/** @deprecated use acquire/release — kept for simple call sites */
export function setCrmDraftLock(active: boolean): void {
  if (active) acquireCrmDraftLock();
  else releaseCrmDraftLock();
}

export function isCrmDraftLockActive(): boolean {
  if (typeof window === "undefined") return false;
  return Number.parseInt(sessionStorage.getItem(COUNT_KEY) ?? "0", 10) > 0;
}
