export const DB_CHANGED_EVENT = "bess-db-changed";
export const DB_SAVED_EVENT = "bess-db-saved";
export const CRM_CLOUD_PUSH_EVENT = "bess-crm-cloud-push";
export const DB_STORAGE_KEY = "bess-motors-db";

export function notifyDbChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
}

export function notifyCrmCloudPush(ok: boolean, error?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CRM_CLOUD_PUSH_EVENT, { detail: { ok, error } })
  );
}
