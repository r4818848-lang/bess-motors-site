/** Blocks cloud pull while CRM create/edit draft is open (prevents losing unsaved work orders). */
const KEY = "bess-crm-draft-active";

export function setCrmDraftLock(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) sessionStorage.setItem(KEY, "1");
  else sessionStorage.removeItem(KEY);
}

export function isCrmDraftLockActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "1";
}
