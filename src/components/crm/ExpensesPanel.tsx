"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb, type ServiceExpense, type ExpenseCategory } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import { Button } from "@/components/ui/Button";
import { saveDbAndPushCrm, saveDbAndPushCrmDelete } from "@/lib/cloud-crm-db";
import { PriceNumberInput } from "@/components/ui/PriceNumberInput";

const categories: ExpenseCategory[] = [
  "rent",
  "tax",
  "purchase",
  "tools",
  "utilities",
  "marketing",
  "salary",
  "other",
];

export function ExpensesPanel({ onUpdate }: { onUpdate: () => void }) {
  const { t } = useI18n();
  const w = t.wo;
  useDbSync();
  const db = loadDb();
  const [form, setForm] = useState({
    category: "other" as ExpenseCategory,
    description: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
  });

  const c = t.crm;

  const add = async () => {
    if (!form.description || form.amount <= 0) return;
    const fresh = loadDb();
    fresh.expenses.push({
      id: `ex-${Date.now()}`,
      ...form,
    });
    const ok = await saveDbAndPushCrm(fresh);
    onUpdate();
    if (!ok) return;
    setForm({ category: "other", description: "", amount: 0, date: form.date });
  };

  const remove = async (id: string) => {
    const fresh = loadDb();
    fresh.expenses = fresh.expenses.filter((e) => e.id !== id);
    const ok = await saveDbAndPushCrmDelete(fresh);
    onUpdate();
    if (!ok) return;
  };

  const total = db.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl uppercase text-glow">{w.internalExpenses}</h2>
      <p className="text-sm text-bm-muted">{w.expensesDesc}</p>

      <div className="glass-red rounded-xl p-6 neon-border grid md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="text-xs text-bm-muted uppercase">{w.category}</label>
          <select
            className="input-premium mt-1"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {w.expenseCategories[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-bm-muted uppercase">{w.description}</label>
          <input
            className="input-premium mt-1"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-bm-muted uppercase">{w.amount}</label>
          <PriceNumberInput
            className="input-premium mt-1"
            min={0}
            step={0.01}
            value={form.amount}
            onChange={(amount) => setForm({ ...form, amount })}
          />
        </div>
        <div>
          <label className="text-xs text-bm-muted uppercase">{t.crm.date}</label>
          <input
            type="date"
            className="input-premium mt-1"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <Button onClick={add}>
          <Plus size={16} /> {t.common.add}
        </Button>
      </div>

      <div className="glass-red rounded-xl overflow-hidden neon-border">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>{t.crm.date}</th>
              <th>{w.category}</th>
              <th>{w.description}</th>
              <th>{w.amount}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...db.expenses].reverse().map((e) => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>{w.expenseCategories[e.category]}</td>
                <td>{e.description}</td>
                <td className="font-mono text-red-400">-{e.amount.toFixed(2)} zł</td>
                <td>
                  <button type="button" onClick={() => remove(e.id)} className="text-bm-muted hover:text-bm-red">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-display text-lg text-right">
        {w.expensesTotal}: <span className="text-red-400">{total.toFixed(2)} zł</span>
      </p>
    </div>
  );
}
