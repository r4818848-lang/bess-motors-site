import type { Database } from "@/lib/store";

/** Strip huge base64 blobs from localStorage to keep CRM/cabinet fast. */
const MAX_DATA_URL_CHARS = 100_000;

export function trimDatabaseFiles(db: Database): Database {
  let changed = false;
  const workOrders = db.workOrders.map((o) => {
    const files = o.files?.map((f) => {
      if (f.dataUrl && f.dataUrl.length > MAX_DATA_URL_CHARS) {
        changed = true;
        const { dataUrl: _removed, ...rest } = f;
        return rest;
      }
      return f;
    });
    return files ? { ...o, files } : o;
  });
  return changed ? { ...db, workOrders } : db;
}
