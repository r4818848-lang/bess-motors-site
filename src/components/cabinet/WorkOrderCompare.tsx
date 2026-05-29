"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Database, WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Card } from "@/components/ui/Card";

function serviceKey(name: string): string {
  return name.trim().toLowerCase();
}

export function WorkOrderCompare({
  orders,
  db,
}: {
  orders: WorkOrder[];
  db: Database;
}) {
  const { t } = useI18n();
  const c = t.workOrderCompare;
  const [aId, setAId] = useState(orders[0]?.id ?? "");
  const [bId, setBId] = useState(orders[1]?.id ?? "");

  const pair = useMemo(() => {
    const a = orders.find((o) => o.id === aId);
    const b = orders.find((o) => o.id === bId);
    return { a, b };
  }, [orders, aId, bId]);

  const diff = useMemo(() => {
    const { a, b } = pair;
    if (!a || !b) return null;
    const totalA = calcClientTotal(a);
    const totalB = calcClientTotal(b);
    const delta = totalB - totalA;
    const pct = totalA > 0 ? Math.round((delta / totalA) * 100) : 0;
    const mapA = new Map(a.services.map((s) => [serviceKey(s.name), s]));
    const mapB = new Map(b.services.map((s) => [serviceKey(s.name), s]));
    const onlyA: string[] = [];
    const onlyB: string[] = [];
    const changed: { name: string; from: number; to: number }[] = [];
    for (const [k, sa] of mapA) {
      const sb = mapB.get(k);
      if (!sb) onlyA.push(sa.name);
      else if (sa.price * sa.qty !== sb.price * sb.qty) {
        changed.push({ name: sa.name, from: sa.price * sa.qty, to: sb.price * sb.qty });
      }
    }
    for (const [k, sb] of mapB) {
      if (!mapA.has(k)) onlyB.push(sb.name);
    }
    const partsA = a.parts.reduce((s, p) => s + p.sellPrice * p.qty, 0);
    const partsB = b.parts.reduce((s, p) => s + p.sellPrice * p.qty, 0);
    const laborA = a.services.reduce((s, x) => s + x.price * x.qty, 0);
    const laborB = b.services.reduce((s, x) => s + x.price * x.qty, 0);
    return { totalA, totalB, delta, pct, onlyA, onlyB, changed, partsA, partsB, laborA, laborB };
  }, [pair]);

  if (orders.length < 2) return null;

  return (
    <Card className="p-5 mb-6">
      <h3 className="font-display uppercase text-sm mb-4">{c.title}</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <select className="input text-sm" value={aId} onChange={(e) => setAId(e.target.value)}>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.number} ({o.createdAt.slice(0, 10)})
            </option>
          ))}
        </select>
        <select className="input text-sm" value={bId} onChange={(e) => setBId(e.target.value)}>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.number} ({o.createdAt.slice(0, 10)})
            </option>
          ))}
        </select>
      </div>

      {diff ? (
        <p className="text-sm mb-4">
          {c.difference}:{" "}
          <b className={diff.delta >= 0 ? "text-amber-400" : "text-green-400"}>
            {diff.delta >= 0 ? "+" : ""}
            {diff.delta.toFixed(2)} zł ({diff.pct >= 0 ? "+" : ""}
            {diff.pct}%)
          </b>
        </p>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        {[pair.a, pair.b].map((o, i) =>
          o ? (
            <div key={o.id} className="rounded-lg border border-bm-border/50 p-3">
              <p className="font-bold text-bm-red mb-2">{o.number}</p>
              <p className="text-bm-muted text-xs mb-2">
                {db.vehicles.find((v) => v.id === o.vehicleId)?.plate ?? "—"} · {o.createdAt.slice(0, 10)}
              </p>
              <p>
                {t.repairStatus[o.status]} · <b>{calcClientTotal(o).toFixed(2)} zł</b>
              </p>
              {diff && i === 0 ? (
                <p className="text-xs text-bm-muted mt-2">
                  {c.labor}: {diff.laborA.toFixed(0)} · {c.parts}: {diff.partsA.toFixed(0)}
                </p>
              ) : null}
              {diff && i === 1 ? (
                <p className="text-xs text-bm-muted mt-2">
                  {c.labor}: {diff.laborB.toFixed(0)} · {c.parts}: {diff.partsB.toFixed(0)}
                </p>
              ) : null}
              <ul className="mt-2 space-y-1 text-xs text-bm-muted">
                {o.services.slice(0, 8).map((s) => (
                  <li key={s.id}>
                    {s.name} ×{s.qty}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div key={i}>—</div>
          )
        )}
      </div>

      {diff && (diff.onlyA.length || diff.onlyB.length || diff.changed.length) ? (
        <div className="mt-4 text-xs text-bm-muted space-y-2">
          {diff.onlyB.length > 0 ? (
            <p>
              <span className="text-amber-400">+</span> {diff.onlyB.join(", ")}
            </p>
          ) : null}
          {diff.onlyA.length > 0 ? (
            <p>
              <span className="text-green-400">−</span> {diff.onlyA.join(", ")}
            </p>
          ) : null}
          {diff.changed.map((c) => (
            <p key={c.name}>
              Δ {c.name}: {c.from.toFixed(0)} → {c.to.toFixed(0)} zł
            </p>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
