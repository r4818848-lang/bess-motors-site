"use client";

import { useState } from "react";
import { loadDb, saveDb, type WarehouseItem } from "@/lib/store";
import { migrateWarehouseItem } from "@/lib/warehouse-stock";
import { useDbSync } from "@/hooks/useDbSync";
import { useI18n } from "@/lib/i18n/context";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WarehousePanel() {
  const { t } = useI18n();
  const c = t.crm;
  const tick = useDbSync();
  const db = loadDb();
  void tick;
  const [edit, setEdit] = useState<WarehouseItem | null>(null);

  const items = db.warehouse.map(migrateWarehouseItem);

  const removeItem = (id: string) => {
    if (!confirm(c.confirmDeleteWarehouse)) return;
    const fresh = loadDb();
    fresh.warehouse = fresh.warehouse.filter((w) => w.id !== id);
    saveDb(fresh);
    if (edit?.id === id) setEdit(null);
  };

  const saveItem = () => {
    if (!edit) return;
    const fresh = loadDb();
    const idx = fresh.warehouse.findIndex((w) => w.id === edit.id);
    const row = migrateWarehouseItem(edit);
    if (idx >= 0) fresh.warehouse[idx] = row;
    else fresh.warehouse.push({ ...row, id: `wh-${Date.now()}` });
    saveDb(fresh);
    setEdit(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-lg uppercase">{c.warehouse}</h2>
        <Button
          onClick={() =>
            setEdit({
              id: "",
              name: "",
              sku: "",
              qty: 0,
              minQty: 3,
              purchasePrice: 0,
              sellPrice: 0,
              supplier: "",
              qrCode: "",
            })
          }
        >
          + Pozycja
        </Button>
      </div>

      <table className="dashboard-table w-full">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>SKU</th>
            <th>Ilość</th>
            <th>Min</th>
            <th>Cena</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className={i.qty <= (i.minQty ?? 3) ? "text-amber-400" : ""}>
              <td>{i.name}</td>
              <td className="font-mono text-xs">{i.sku}</td>
              <td>{i.qty}</td>
              <td>{i.minQty ?? 3}</td>
              <td>{i.sellPrice} zł</td>
              <td className="whitespace-nowrap space-x-2">
                <button type="button" className="text-bm-red text-xs" onClick={() => setEdit(i)}>
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  className="text-red-400 text-xs inline-flex items-center gap-1"
                  onClick={() => removeItem(i.id)}
                >
                  <Trash2 size={12} /> {t.common.delete}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {edit && (
        <div className="glass rounded-xl p-4 grid gap-2 max-w-md">
          <input
            className="input-field"
            placeholder="Nazwa"
            value={edit.name}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="SKU"
            value={edit.sku}
            onChange={(e) => setEdit({ ...edit, sku: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              className="input-field"
              placeholder="Qty"
              value={edit.qty}
              onChange={(e) => setEdit({ ...edit, qty: Number(e.target.value) })}
            />
            <input
              type="number"
              className="input-field"
              placeholder="Min"
              value={edit.minQty ?? 3}
              onChange={(e) => setEdit({ ...edit, minQty: Number(e.target.value) })}
            />
            <input
              type="number"
              className="input-field"
              placeholder="Sell"
              value={edit.sellPrice}
              onChange={(e) => setEdit({ ...edit, sellPrice: Number(e.target.value) })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveItem}>Zapisz</Button>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Anuluj
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
