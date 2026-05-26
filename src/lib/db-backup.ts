import { mergeStoredDb, saveDb, loadDb, type Database } from "./store";

export const DB_BACKUP_KEY = "bess-motors-db-backup";
export const DB_BACKUP_PREV_KEY = "bess-motors-db-backup-prev";

function readRawBackup(key: string): Database | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return mergeStoredDb(JSON.parse(raw) as Partial<Database>);
  } catch {
    return null;
  }
}

export function getBackupSummary(key: string): { expenses: number; workOrders: number } | null {
  const db = readRawBackup(key);
  if (!db) return null;
  return { expenses: db.expenses.length, workOrders: db.workOrders.length };
}

export function restoreFromBackup(key: string): boolean {
  const db = readRawBackup(key);
  if (!db) return false;
  saveDb(db);
  return true;
}

export function exportDbDownload(): void {
  const json = JSON.stringify(loadDb(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bess-motors-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDbFromFile(file: File, onDone: (ok: boolean) => void): void {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result)) as Partial<Database>;
      saveDb(mergeStoredDb(parsed));
      onDone(true);
    } catch {
      onDone(false);
    }
  };
  reader.onerror = () => onDone(false);
  reader.readAsText(file);
}
