"use client";

import Link from "next/link";
import {
  Pencil,
  PackageCheck,
  User,
  Car,
  Pin,
  PinOff,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";
import { isWorkOrderClosed } from "@/lib/work-order-lifecycle";
import { useI18n } from "@/lib/i18n/context";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import type { Database, RepairStatus, WorkOrder } from "@/lib/store";
import { displayOrderTotal } from "@/lib/crm-display-price";
import { getWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { repairStatusPillClass } from "@/lib/work-order-status-style";
import { CrmTableFooter } from "@/components/crm/CrmTableFooter";

const STATUSES: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

function formatTableMoney(value: number, locale: string): string {
  return value.toLocaleString(locale === "pl" ? "pl-PL" : locale === "ru" || locale === "uk" ? "ru-RU" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Props = {
  db: Database;
  orders: WorkOrder[];
  onEdit: (orderId: string) => void;
  onStatusChange?: (orderId: string, status: RepairStatus) => void;
  showExtended?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (orderId: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  onMarkDelivered?: (orderId: string) => void;
  isPinned?: (orderId: string) => boolean;
  onTogglePin?: (orderId: string) => void;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function WorkOrdersTable({
  db,
  orders,
  onEdit,
  onStatusChange,
  showExtended = false,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onMarkDelivered,
  isPinned,
  onTogglePin,
  page = 1,
  pageSize = 100,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const { t, locale } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const docSt = t.documentStatus;
  const pm = t.paymentMethods;
  const { priceMode } = useCrmDisplay();
  const allSelected =
    selectable && orders.length > 0 && orders.every((o) => selectedIds?.has(o.id));
  const totalSum = orders.reduce(
    (s, o) => s + displayOrderTotal(o, priceMode, db.settings.vatRate ?? 23),
    0
  );
  const total = totalCount ?? orders.length;
  const showFooter = Boolean(onPageChange && onPageSizeChange);
  const colCount =
    8 + (showExtended ? 2 : 0) + (selectable ? 1 : 0) + (onTogglePin ? 1 : 0);

  return (
    <div className="crm-mw-card crm-mw-orders-card">
      <div className="table-scroll">
        <table className="crm-mw-table min-w-[960px]">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="crm-mw-checkbox"
                    checked={allSelected}
                    onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                    aria-label={c.selectAll}
                  />
                </th>
              )}
              <th>{c.orderNumberColumn}</th>
              {onTogglePin && <th className="w-10" aria-hidden />}
              <th>{c.createdDate}</th>
              <th>{c.completedDate}</th>
              <th>{c.status}</th>
              <th>{c.client}</th>
              <th>{c.receptionDate}</th>
              <th>
                {c.total}
                <span className="crm-mw-th-mode">
                  {priceMode === "gross" ? c.brutto : c.netto}
                </span>
              </th>
              <th>{c.vehicleColumn}</th>
              {showExtended && (
                <>
                  <th>{w.paymentMethodLabel}</th>
                  <th>{t.document.documentStatus}</th>
                </>
              )}
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="crm-mw-empty">
                  {c.noOrders}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const client = db.users.find((u) => u.id === order.userId);
                const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
                const completed = getWorkOrderCompletedAt(order);
                const amount = displayOrderTotal(
                  order,
                  priceMode,
                  db.settings.vatRate ?? 23
                );
                const pinned = isPinned?.(order.id);
                const vehicleLine = vehicle
                  ? `${vehicle.make} ${vehicle.model} ${vehicle.plate}${vehicle.color ? ` ${vehicle.color}` : ""}`.trim()
                  : "—";

                return (
                  <tr
                    key={order.id}
                    className={clsx(pinned && "crm-mw-row-pinned")}
                  >
                    {selectable && (
                      <td>
                        <input
                          type="checkbox"
                          className="crm-mw-checkbox"
                          checked={selectedIds?.has(order.id) ?? false}
                          onChange={() => onToggleSelect?.(order.id)}
                          aria-label={order.number}
                        />
                      </td>
                    )}
                    <td>
                      <button
                        type="button"
                        onClick={() => onEdit(order.id)}
                        className="crm-mw-order-link"
                      >
                        <Car size={14} className="shrink-0 text-gray-400" />
                        <span>{order.number}</span>
                        <Pencil size={12} className="shrink-0 opacity-50" />
                      </button>
                    </td>
                    {onTogglePin && (
                      <td>
                        <button
                          type="button"
                          className={clsx(
                            "crm-mw-icon-btn",
                            pinned && "text-amber-600"
                          )}
                          onClick={() => onTogglePin(order.id)}
                          title={pinned ? c.unpinOrder : c.pinOrder}
                        >
                          {pinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                        </button>
                      </td>
                    )}
                    <td className="crm-mw-date">{order.createdAt.slice(0, 10)}</td>
                    <td className="crm-mw-date crm-mw-muted">
                      {completed ?? ""}
                    </td>
                    <td>
                      {onStatusChange && !isWorkOrderClosed(order) ? (
                        <div className="crm-mw-status-select-wrap">
                          <select
                            className={repairStatusPillClass(order.status)}
                            value={order.status}
                            onChange={(e) =>
                              onStatusChange(order.id, e.target.value as RepairStatus)
                            }
                            aria-label={c.status}
                          >
                            {STATUSES.filter((s) => s !== "delivered").map((s) => (
                              <option key={s} value={s}>
                                {t.repairStatus[s]}
                              </option>
                            ))}
                            <option value="delivered">{t.repairStatus.delivered}</option>
                          </select>
                          <ChevronDown
                            size={12}
                            className="crm-mw-status-chevron pointer-events-none"
                          />
                        </div>
                      ) : (
                        <span className={repairStatusPillClass(order.status)}>
                          {t.repairStatus[order.status]}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="crm-mw-client-cell">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium">{client?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="crm-mw-date">{order.createdAt.slice(0, 10)}</td>
                    <td className="crm-mw-amount">
                      {formatTableMoney(amount, locale)}
                    </td>
                    <td>
                      <div className="crm-mw-vehicle-cell" title={vehicleLine}>
                        <Car size={14} className="text-gray-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{vehicleLine}</span>
                      </div>
                    </td>
                    {showExtended && (
                      <>
                        <td className="text-xs">
                          {order.paymentMethod
                            ? pm[order.paymentMethod]
                            : "—"}
                        </td>
                        <td className="text-xs">
                          {docSt[order.documentStatus ?? "awaiting_signature"]}
                        </td>
                      </>
                    )}
                    <td className="crm-mw-actions">
                      {onMarkDelivered && !isWorkOrderClosed(order) && (
                        <button
                          type="button"
                          onClick={() => onMarkDelivered(order.id)}
                          className="crm-mw-icon-btn text-green-600"
                          title={c.markDelivered}
                        >
                          <PackageCheck size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(order.id)}
                        className="crm-mw-icon-btn"
                        title={w.editOrder}
                      >
                        <Pencil size={16} />
                      </button>
                      <Link
                        href={`/crm/work-orders?edit=${encodeURIComponent(order.id)}`}
                        className="sr-only"
                      >
                        {w.editOrder}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {orders.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={(selectable ? 1 : 0) + (onTogglePin ? 1 : 0) + 6}
                  className="crm-mw-tfoot-label"
                >
                  {c.tableTotal}
                </td>
                <td className="crm-mw-amount crm-mw-tfoot-sum">
                  {formatTableMoney(totalSum, locale)}
                </td>
                <td colSpan={showExtended ? 3 : 2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {showFooter && onPageChange && onPageSizeChange && (
        <CrmTableFooter
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
