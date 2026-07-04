"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import { Button } from "@/components/ui/Button";
import { saveDbAndPushCrm, saveDbAndPushCrmDelete } from "@/lib/cloud-crm-db";
import { PriceNumberInput } from "@/components/ui/PriceNumberInput";
import {
  computeMonthlyConsumablesTotals,
  createMonthlyConsumableEntry,
  filterMonthlyConsumables,
  formatConsumablesPlainText,
  normalizeConsumablePrices,
} from "@/lib/monthly-consumables";
import {
  currentMonthKey,
  formatMonthLabel,
  shiftMonthKey,
} from "@/lib/monthly-parts";
import { formatDisplayDateKey } from "@/lib/display-date";

export function ConsumablesListPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.warehouse;
  const tick = useDbSync();
  const db = loadDb();
  void tick;

  const [month, setMonth] = useState(currentMonthKey());
  const [form, setForm] = useState({ name: "", partNumber: "", purchaseBrutto: 0 });
  const [copyHint, setCopyHint] = useState(false);

  const rows = useMemo(
    () => filterMonthlyConsumables(db.monthlyConsumables, month),
    [db.monthlyConsumables, month]
  );
  const totals = useMemo(() => computeMonthlyConsumablesTotals(rows), [rows]);

  const add = async () => {
    const name = form.name.trim();
    if (name.length < 2 || form.purchaseBrutto <= 0) return;
    const fresh = loadDb();
    if (!fresh.monthlyConsumables) fresh.monthlyConsumables = [];
    fresh.monthlyConsumables.push(
      createMonthlyConsumableEntry(
        month,
        {
          name,
          partNumber: form.partNumber.trim(),
          purchaseBrutto: form.purchaseBrutto,
        },
        { source: "crm" }
      )
    );
    const ok = await saveDbAndPushCrm(fresh);
    if (!ok) return;
    setForm({ name: "", partNumber: "", purchaseBrutto: 0 });
  };

  const remove = async (id: string) => {
    if (!confirm(w.confirmDeleteConsumable)) return;
    const fresh = loadDb();
    fresh.monthlyConsumables = (fresh.monthlyConsumables ?? []).filter((e) => e.id !== id);
    await saveDbAndPushCrmDelete(fresh);
  };

  const copyList = async () => {
    const text = formatConsumablesPlainText(db.monthlyConsumables ?? [], month);
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(true);
      setTimeout(() => setCopyHint(false), 2000);
    } catch {
      window.prompt(w.copyList, text);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base uppercase">{w.consumablesTitle}</h3>
          <p className="text-sm text-bm-muted mt-1">{w.consumablesHint}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5"
            onClick={() => setMonth((m) => shiftMonthKey(m, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold min-w-[9rem] text-center capitalize">
            {formatMonthLabel(month)}
          </span>
          <button
            type="button"
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5"
            onClick={() => setMonth((m) => shiftMonthKey(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-4 grid md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-xs text-bm-muted uppercase">{c.name}</label>
          <input
            className="input-field mt-1 w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={c.name}
          />
        </div>
        <div>
          <label className="text-xs text-bm-muted uppercase">{w.partNumber}</label>
          <input
            className="input-field mt-1 w-full font-mono text-sm"
            value={form.partNumber}
            onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-bm-muted uppercase">{w.purchaseBrutto}</label>
          <PriceNumberInput
            className="input-field mt-1 w-full"
            min={0}
            step={0.01}
            value={form.purchaseBrutto}
            onChange={(purchaseBrutto) => setForm({ ...form, purchaseBrutto })}
          />
        </div>
        <Button onClick={add} className="md:col-span-4 w-fit">
          <Plus size={16} /> {w.addConsumable}
        </Button>
      </div>

      <p className="text-xs text-bm-muted">{w.vatNote}</p>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={copyList} disabled={!rows.length}>
          <Copy size={16} />
          {copyHint ? w.listCopied : w.copyList}
        </Button>
        <span className="text-sm text-bm-muted self-center">
          {w.itemsCount}: <b>{totals.count}</b> · {w.totalPurchase}:{" "}
          <b>
            {totals.purchaseBrutto.toFixed(2)} / {totals.purchaseNetto.toFixed(2)} {t.common.currency}
          </b>
        </span>
      </div>

      <div className="glass rounded-xl overflow-x-auto">
        <table className="dashboard-table w-full min-w-[640px]">
          <thead>
            <tr>
              <th>{t.crm.date}</th>
              <th>{c.name}</th>
              <th>{w.partNumber}</th>
              <th>{w.purchaseNetto}</th>
              <th>{w.purchaseBrutto}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-bm-muted py-8">
                  {w.emptyList}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const p = normalizeConsumablePrices(r);
                return (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">
                      {formatDisplayDateKey(r.createdAt.slice(0, 10))}
                    </td>
                    <td>{r.name}</td>
                    <td className="font-mono text-xs">{r.partNumber || "—"}</td>
                    <td>{p.purchaseNetto.toFixed(2)}</td>
                    <td>{p.purchaseBrutto.toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        className="text-red-400 text-xs inline-flex items-center gap-1"
                        onClick={() => remove(r.id)}
                      >
                        <Trash2 size={12} /> {t.common.delete}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
