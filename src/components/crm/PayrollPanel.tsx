"use client";

import { useCallback, useEffect, useState } from "react";
import { staffCrmFetch } from "@/lib/crm-staff-fetch";
import { Card } from "@/components/ui/Card";
import type { MechanicPayrollReport } from "@/lib/payroll";

export function PayrollPanel() {
  const [week, setWeek] = useState("");
  const [reports, setReports] = useState<MechanicPayrollReport[]>([]);
  const [rule, setRule] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await staffCrmFetch("/api/crm/payroll");
    if (!res?.ok) {
      setError("Не удалось загрузить зарплаты (нужен admin + cloud)");
      return;
    }
    const json = (await res.json()) as {
      week: string;
      reports: MechanicPayrollReport[];
      rule?: string;
    };
    setWeek(json.week);
    setReports(json.reports || []);
    setRule(json.rule || "");
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg uppercase">Зарплаты механиков</h3>
        <p className="text-sm text-bm-muted">Неделя (Пн–Вс, Europe/Warsaw): {week || "—"}</p>
        {rule && <p className="text-xs text-bm-muted mt-1">{rule}</p>}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {reports.map((r) => (
        <Card key={r.mechanicId} className="p-4 space-y-2">
          <div className="flex justify-between gap-2">
            <p className="font-semibold">{r.mechanicName}</p>
            <p className="text-bm-red font-bold">{r.total.toFixed(2)} zł</p>
          </div>
          {r.locked && (
            <p className="text-xs text-amber-400">Период заблокирован — только документированные корректировки</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-bm-muted uppercase">
                  <th className="p-1">Дата</th>
                  <th className="p-1">Заказ</th>
                  <th className="p-1">Авто</th>
                  <th className="p-1">Работа</th>
                  <th className="p-1">База netto</th>
                  <th className="p-1">%</th>
                  <th className="p-1">Начисление</th>
                </tr>
              </thead>
              <tbody>
                {r.lines.map((l, i) => (
                  <tr key={`${l.orderNumber}-${i}`} className="border-t border-white/5">
                    <td className="p-1">{l.date}</td>
                    <td className="p-1 font-mono">{l.orderNumber}</td>
                    <td className="p-1">{l.vehicleLabel}</td>
                    <td className="p-1">{l.workLabel}</td>
                    <td className="p-1">{l.laborNetBase.toFixed(2)}</td>
                    <td className="p-1">{l.laborPercent}%</td>
                    <td className="p-1">{l.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {r.lines.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-2 text-bm-muted">
                      Нет закрытых заказов за неделю
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
