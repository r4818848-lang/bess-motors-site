"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Pencil, Trash2, User, Car } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb } from "@/lib/store";
import { pushCrmDelete } from "@/lib/cloud-crm-db";
import { useDbSync } from "@/hooks/useDbSync";
import { filterWorkOrdersByQuery } from "@/lib/crm-search";
import { filterClosedWorkOrders } from "@/lib/work-order-lifecycle";
import { displayOrderTotal } from "@/lib/crm-display-price";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import { repairStatusPillClass } from "@/lib/work-order-status-style";
import { getWorkOrderCompletedAt } from "@/lib/work-order-dates";

type Props = {
  /** When set, hides internal search (parent provides toolbar search) */
  searchQuery?: string;
};

export function WorkOrderHistoryPanel({ searchQuery: externalQuery }: Props = {}) {
  const { t, locale } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const { priceMode } = useCrmDisplay();
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    const closed = filterClosedWorkOrders(db.workOrders);
    const bySearch = filterWorkOrdersByQuery(db, closed, externalQuery ?? "");
    const vatRate = db.settings.vatRate ?? 23;
    return bySearch.map((order) => ({
      order,
      client: db.users.find((u) => u.id === order.userId),
      vehicle: db.vehicles.find((v) => v.id === order.vehicleId),
      total: displayOrderTotal(order, priceMode, vatRate),
      completed: getWorkOrderCompletedAt(order),
    }));
  }, [externalQuery, dbTick, priceMode]);

  const removeOrder = async (orderId: string) => {
    if (!confirm(c.confirmDeleteOrderHistory)) return;
    const fresh = loadDb();
    fresh.workOrders = fresh.workOrders.filter((o) => o.id !== orderId);
    saveDb(fresh);
    const ok = await pushCrmDelete(fresh);
    if (!ok) return;
  };

  const formatMoney = (n: number) =>
    n.toLocaleString(locale === "pl" ? "pl-PL" : locale === "ru" || locale === "uk" ? "ru-RU" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="crm-mw-card crm-mw-orders-card">
      <div className="table-scroll">
        <table className="crm-mw-table min-w-[800px]">
          <thead>
            <tr>
              <th>{c.orderNumberColumn}</th>
              <th>{c.createdDate}</th>
              <th>{c.completedDate}</th>
              <th>{c.status}</th>
              <th>{c.client}</th>
              <th>{c.total}</th>
              <th>{c.vehicleColumn}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="crm-mw-empty">
                  {c.noSearchResults}
                </td>
              </tr>
            ) : (
              rows.map(({ order, client, vehicle, total, completed }) => {
                const vehicleLine = vehicle
                  ? `${vehicle.make} ${vehicle.model} ${vehicle.plate}`.trim()
                  : "—";
                return (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/crm/work-orders?edit=${encodeURIComponent(order.id)}`}
                        className="crm-mw-order-link"
                      >
                        <Car size={14} className="shrink-0 text-gray-400" />
                        {order.number}
                      </Link>
                    </td>
                    <td className="crm-mw-date">{order.createdAt.slice(0, 10)}</td>
                    <td className="crm-mw-date">{completed ?? "—"}</td>
                    <td>
                      <span className={repairStatusPillClass(order.status)}>
                        {t.repairStatus[order.status]}
                      </span>
                    </td>
                    <td>
                      <div className="crm-mw-client-cell">
                        <User size={14} className="text-gray-400 shrink-0" />
                        {client?.name ?? "—"}
                      </div>
                    </td>
                    <td className="crm-mw-amount">{formatMoney(total)}</td>
                    <td>
                      <div className="crm-mw-vehicle-cell">
                        <Car size={14} className="text-gray-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{vehicleLine}</span>
                      </div>
                    </td>
                    <td className="crm-mw-actions">
                      <Link
                        href={`/crm/work-orders?edit=${encodeURIComponent(order.id)}`}
                        className="crm-mw-icon-btn"
                        title={w.editOrder}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeOrder(order.id)}
                        className="crm-mw-icon-btn text-red-600"
                        title={t.common.delete}
                      >
                        <Trash2 size={16} />
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
