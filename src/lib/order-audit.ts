import type { WorkOrder } from "@/lib/store";

export type OrderAuditEntry = {
  at: string;
  field: string;
  from?: string;
  to?: string;
  by?: string;
};

/** Append audit entries for changed scalar / money fields. Idempotent-ish for identical values. */
export function appendOrderAudit(
  prev: WorkOrder | null | undefined,
  next: WorkOrder,
  by = "staff"
): WorkOrder {
  const at = new Date().toISOString();
  const log: OrderAuditEntry[] = [...(next.auditLog || [])];
  const track: (keyof WorkOrder)[] = [
    "status",
    "mechanicId",
    "orderDiscount",
    "paymentStatus",
    "paymentMethod",
    "vatEnabled",
    "clientNotes",
    "internalNotes",
  ];
  if (prev) {
    for (const field of track) {
      const a = String(prev[field] ?? "");
      const b = String(next[field] ?? "");
      if (a !== b) {
        log.push({ at, field, from: a, to: b, by });
      }
    }
    const prevSvc = JSON.stringify(prev.services);
    const nextSvc = JSON.stringify(next.services);
    if (prevSvc !== nextSvc) {
      log.push({
        at,
        field: "services",
        from: `${prev.services.length} lines`,
        to: `${next.services.length} lines`,
        by,
      });
    }
    const prevParts = JSON.stringify(prev.parts);
    const nextParts = JSON.stringify(next.parts);
    if (prevParts !== nextParts) {
      log.push({
        at,
        field: "parts",
        from: `${prev.parts.length} lines`,
        to: `${next.parts.length} lines`,
        by,
      });
    }
  } else {
    log.push({ at, field: "created", to: next.number, by });
  }
  return { ...next, auditLog: log.slice(-200) };
}
