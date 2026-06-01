import type { WorkOrderLine } from "@/lib/store";

const KEY = "bess-quick-create-order-draft";

export type QuickCreateOrderDraft = {
  userId: string;
  vehicleId: string;
  clientNotes: string;
  services: WorkOrderLine[];
  mechanicId: string;
  vatEnabled: boolean;
  receptionDate: string;
  receptionChecklist: Record<string, boolean>;
};

export function saveQuickCreateOrderDraft(draft: QuickCreateOrderDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function loadQuickCreateOrderDraft(): QuickCreateOrderDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuickCreateOrderDraft;
  } catch {
    return null;
  }
}

export function clearQuickCreateOrderDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
