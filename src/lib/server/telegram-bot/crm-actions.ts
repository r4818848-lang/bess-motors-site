import type { Database, ExpenseCategory, ServiceExpense } from "@/lib/store";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";

export async function loadCrmFromCloud(): Promise<Database | null> {
  const snap = await cloudGetCrmStore();
  return snap?.doc ?? null;
}

export async function mutateCrm(
  mutator: (db: Database) => void
): Promise<{ ok: boolean; error?: string }> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return { ok: false, error: "cloud_empty" };

  const db = structuredClone(snap.doc) as Database;
  mutator(db);
  const result = await cloudPutCrmStore(db);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function addExpenseToCrm(expense: Omit<ServiceExpense, "id">): Promise<{ ok: boolean; error?: string }> {
  return mutateCrm((db) => {
    db.expenses.push({
      id: `ex-${Date.now()}`,
      ...expense,
    });
  });
}

export function parseExpenseInput(
  text: string,
  category: ExpenseCategory
): { ok: true; expense: Omit<ServiceExpense, "id"> } | { ok: false } {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\d+(?:[.,]\d{1,2})?)\s+(.+)$/);
  if (!match) return { ok: false };

  const amount = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false };

  let rest = match[2].trim();
  let date = new Date().toISOString().slice(0, 10);
  const dateMatch = rest.match(/\s(\d{4}-\d{2}-\d{2})$/);
  if (dateMatch) {
    date = dateMatch[1];
    rest = rest.slice(0, -dateMatch[0].length).trim();
  }
  if (!rest) return { ok: false };

  return {
    ok: true,
    expense: { category, description: rest, amount, date },
  };
}

export function isValidDateKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
