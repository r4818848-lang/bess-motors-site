"use client";

import Link from "next/link";
import { Pencil, PackageCheck } from "lucide-react";
import { isWorkOrderClosed } from "@/lib/work-order-lifecycle";
import { useI18n } from "@/lib/i18n/context";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import type { Database, WorkOrder } from "@/lib/store";
import { displayOrderTotal } from "@/lib/crm-display-price";
import { getWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { VehicleThumbnail } from "@/components/vehicle/VehicleThumbnail";

type Props = {
  db: Database;
  orders: WorkOrder[];
  onEdit: (orderId: string) => void;
  showExtended?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (orderId: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  onMarkDelivered?: (orderId: string) => void;
};

export function WorkOrdersTable({
  db,
  orders,
  onEdit,
  showExtended = true,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onMarkDelivered,
}: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const docSt = t.documentStatus;
  const pm = t.paymentMethods;
  const { priceMode } = useCrmDisplay();
  const allSelected =
    selectable &&
    orders.length > 0 &&
    orders.every((o) => selectedIds?.has(o.id));
  const totalSum = orders.reduce(
    (s, o) => s + displayOrderTotal(o, priceMode, db.settings.vatRate ?? 23),
    0
  );
  const colCount =
    7 +
    (showExtended ? 2 : 0) +
    (selectable ? 1 : 0) +
    1;

  return (
    <div className="crm-mw-card">
      <div className="table-scroll">
        <table className="crm-mw-table min-w-[720px]">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                    aria-label={c.selectAll}
                  />
                </th>
              )}
              <th>#</th>
              <th>{c.createdDate}</th>
              <th>{c.completedDate}</th>
              <th>{c.status}</th>
              <th>{c.client}</th>
              <th>{c.vehicleColumn}</th>
              <th>
                {c.total}
                <span className="block font-normal normal-case text-[9px] text-gray-500">
                  {priceMode === "gross" ? c.brutto : c.netto}
                </span>
              </th>
              {showExtended && (
                <>
                  <th>{w.paymentMethodLabel}</th>
                  <th>{t.document.documentStatus}</th>
                </>
              )}
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="text-center text-bm-muted py-8">
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
                return (
                  <tr key={order.id} className="align-top">
                    {selectable && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds?.has(order.id) ?? false}
                          onChange={() => onToggleSelect?.(order.id)}
                          aria-label={order.number}
                        />
                      </td>
                    )}
                    <td className="font-mono text-bm-red whitespace-nowrap font-semibold">
                      {order.number}
                    </td>
                    <td className="text-xs whitespace-nowrap">{order.createdAt.slice(0, 10)}</td>
                    <td className="text-xs whitespace-nowrap text-bm-muted">
                      {completed ?? "—"}
                    </td>
                    <td>
                      <span className="status-pill bg-bm-red/15 text-bm-red text-[10px]">
                        {t.repairStatus[order.status]}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-sm">{client?.name ?? "—"}</p>
                      <p className="font-mono text-[10px] text-bm-red">{client?.phone ?? ""}</p>
                    </td>
                    <td>
                      <VehicleThumbnail vehicle={vehicle} />
                    </td>
                    <td className="font-mono whitespace-nowrap font-semibold">
                      {amount.toFixed(2)} zł
                    </td>
                    {showExtended && (
                      <>
                        <td className="text-xs">
                          {order.paymentMethod
                            ? pm[order.paymentMethod]
                            : order.paymentStatus === "paid"
                              ? "—"
                              : "—"}
                        </td>
                        <td className="text-xs">
                          {docSt[order.documentStatus ?? "awaiting_signature"]}
                        </td>
                      </>
                    )}
                    <td className="whitespace-nowrap">
                      {onMarkDelivered && !isWorkOrderClosed(order) && (
                        <button
                          type="button"
                          onClick={() => onMarkDelivered(order.id)}
                          className="text-green-400 hover:bg-green-500/10 p-2 inline-flex rounded"
                          title={c.markDelivered}
                        >
                          <PackageCheck size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(order.id)}
                        className="text-bm-red hover:bg-red-50 p-2 inline-flex rounded"
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
                  colSpan={(selectable ? 1 : 0) + 6}
                  className="text-right text-xs uppercase text-bm-muted"
                >
                  {c.tableTotal}
                </td>
                <td className="font-mono text-bm-red font-bold">
                  {totalSum.toFixed(2)} zł
                </td>
                {showExtended && <td colSpan={2} />}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
