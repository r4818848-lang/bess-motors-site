import type { Database } from "@/lib/store";
import type { ImportWorkOrderDraft } from "@/lib/motowarsztat-import-parser";

export function normalizeImportOrderKey(
  orderNumber: string | undefined,
  fileName: string
): string {
  if (orderNumber?.trim()) return orderNumber.trim().toUpperCase();
  const m = fileName.match(/ZL\s*(\d+)[_/](\d+)[_/](\d+)/i);
  if (!m) return fileName.toUpperCase();
  return `ZL ${m[1]}/${m[2]}/${m[3]}`.toUpperCase();
}

export function importOrderExists(db: Database, key: string): boolean {
  const k = key.toUpperCase();
  return db.workOrders.some(
    (o) =>
      o.number?.toUpperCase() === k ||
      o.internalNotes?.toUpperCase().includes(k)
  );
}

export function prepareImportDraft(
  parsed: ImportWorkOrderDraft,
  fileName: string,
  index: number
): ImportWorkOrderDraft {
  const draft = { ...parsed, services: [...parsed.services], parts: [...parsed.parts] };

  if (!draft.orderNumber) {
    const m = fileName.match(/ZL\s*(\d+)[_/](\d+)[_/](\d+)/i);
    if (m) draft.orderNumber = `ZL ${m[1]}/${m[2]}/${m[3]}`;
  }

  const orderKey = normalizeImportOrderKey(draft.orderNumber, fileName);

  if (!draft.phone?.trim()) {
    draft.phone = `+48${String(900_000_000 + index).slice(-9)}`;
    draft.clientName =
      draft.clientName?.trim() ||
      draft.services[0]?.name?.trim() ||
      `Klient import ${orderKey}`;
    draft.internalNotes = [draft.internalNotes, "Import: brak telefonu w PDF"]
      .filter(Boolean)
      .join("\n");
  }

  if (!draft.clientName?.trim()) {
    draft.clientName = `Klient import ${orderKey}`;
  }

  return draft;
}

export function bufferToImportDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
