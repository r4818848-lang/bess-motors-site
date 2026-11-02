import type { RepairStatus } from "@/lib/store";

/** Default allowed transitions — owner can later customize via settings. */
export const DEFAULT_STATUS_TRANSITIONS: Record<RepairStatus, RepairStatus[]> = {
  received: ["diagnostic", "awaitingApproval", "cancelled"],
  diagnostic: ["awaitingApproval", "waitingParts", "repair", "cancelled"],
  awaitingApproval: ["waitingParts", "partsOrdered", "repair", "cancelled"],
  waitingParts: ["partsOrdered", "repair", "cancelled"],
  partsOrdered: ["waitingParts", "repair", "cancelled"],
  repair: ["waitingParts", "ready", "cancelled"],
  ready: ["delivered", "repair"],
  delivered: [],
  cancelled: ["received"],
};

export function canTransition(from: RepairStatus, to: RepairStatus): boolean {
  if (from === to) return true;
  return (DEFAULT_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

export const STATUS_LABELS_RU: Record<RepairStatus, string> = {
  received: "Новая заявка",
  diagnostic: "Диагностика",
  awaitingApproval: "Ожидает согласования",
  waitingParts: "Ожидает запчастей",
  partsOrdered: "Запчасти заказаны",
  repair: "В ремонте",
  ready: "Готов к выдаче",
  delivered: "Выдан",
  cancelled: "Отменён",
};

export const STATUS_LABELS_PL: Record<RepairStatus, string> = {
  received: "Nowe zlecenie",
  diagnostic: "Diagnostyka",
  awaitingApproval: "Oczekuje na akceptację",
  waitingParts: "Oczekuje na części",
  partsOrdered: "Części zamówione",
  repair: "W naprawie",
  ready: "Gotowe do odbioru",
  delivered: "Wydane",
  cancelled: "Anulowane",
};
