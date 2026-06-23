/** Blocks cloud pull while CRM create/edit draft is open (prevents losing unsaved data). */
const COUNT_KEY = "bess-crm-draft-count";

export const CRM_DRAFT_LOCK_EVENT = "bess-crm-draft-lock";

function notifyDraftLockChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CRM_DRAFT_LOCK_EVENT));
}

export function acquireCrmDraftLock(): void {
  if (typeof window === "undefined") return;
  const n = Number.parseInt(sessionStorage.getItem(COUNT_KEY) ?? "0", 10) + 1;
  sessionStorage.setItem(COUNT_KEY, String(n));
  notifyDraftLockChange();
}

export function releaseCrmDraftLock(): void {
  if (typeof window === "undefined") return;
  const n = Math.max(0, Number.parseInt(sessionStorage.getItem(COUNT_KEY) ?? "0", 10) - 1);
  if (n <= 0) {
    sessionStorage.removeItem(COUNT_KEY);
    void import("@/lib/cloud-crm-db").then((m) => m.flushPendingCloudRevert());
  } else {
    sessionStorage.setItem(COUNT_KEY, String(n));
  }
  notifyDraftLockChange();
}

/** @deprecated use acquire/release — kept for simple call sites */
export function setCrmDraftLock(active: boolean): void {
  if (active) acquireCrmDraftLock();
  else releaseCrmDraftLock();
}

/** Force-clear a stuck draft lock (e.g. after crashed import). Use only on explicit user resync. */
export function forceClearCrmDraftLock(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(COUNT_KEY);
  notifyDraftLockChange();
  void import("@/lib/cloud-crm-db").then((m) => m.flushPendingCloudRevert());
}

export function isCrmDraftLockActive(): boolean {
  if (typeof window === "undefined") return false;
  return Number.parseInt(sessionStorage.getItem(COUNT_KEY) ?? "0", 10) > 0;
}
