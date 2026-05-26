export const DB_CHANGED_EVENT = "bess-db-changed";
export const DB_SAVED_EVENT = "bess-db-saved";
export const DB_STORAGE_KEY = "bess-motors-db";

export function notifyDbChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
}
