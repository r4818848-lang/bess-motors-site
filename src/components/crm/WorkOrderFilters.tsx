"use client";

import { useI18n } from "@/lib/i18n/context";
import type { RepairStatus, PaymentMethod, PaymentStatus } from "@/lib/store";
import { PAYMENT_METHODS } from "@/lib/payment";
import {
  defaultWorkOrderFilters,
  type WorkOrderListFilters,
} from "@/lib/workorder-filters";

const repairStatuses: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

interface Props {
  filters: WorkOrderListFilters;
  onChange: (f: WorkOrderListFilters) => void;
  /** Client cabinet: only repair status */
  clientMode?: boolean;
  /** CRM open orders list: hide «delivered» in status filter */
  openOrdersOnly?: boolean;
}

export function WorkOrderFilters({ filters, onChange, clientMode, openOrdersOnly }: Props) {
  const { t } = useI18n();
  const w = t.wo;
  const pm = t.paymentMethods;
  const ps = t.paymentStatus;

  return (
    <div className="glass-red rounded-xl p-4 neon-border space-y-3">
      <p className="text-xs uppercase text-bm-muted tracking-widest">{w.filterOrders}</p>
      <div className="flex flex-wrap gap-3">
        <label className="text-xs text-bm-muted">
          {w.filterRepair}
          <select
            className="input-premium mt-1 text-sm py-1.5 min-w-[140px]"
            value={filters.repairStatus}
            onChange={(e) =>
              onChange({
                ...filters,
                repairStatus: e.target.value as WorkOrderListFilters["repairStatus"],
              })
            }
          >
            <option value="all">{w.filterAll}</option>
            {repairStatuses
              .filter((s) => !openOrdersOnly || s !== "delivered")
              .map((s) => (
              <option key={s} value={s}>
                {t.repairStatus[s]}
              </option>
            ))}
          </select>
        </label>
        {!clientMode && (
          <>
            <label className="text-xs text-bm-muted">
              {w.filterPayment}
              <select
                className="input-premium mt-1 text-sm py-1.5 min-w-[160px]"
                value={filters.paymentStatus}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    paymentStatus: e.target.value as WorkOrderListFilters["paymentStatus"],
                  })
                }
              >
                <option value="all">{w.filterAll}</option>
                <option value="unpaid">{w.unpaidOrders}</option>
                <option value="paid">{ps.paid}</option>
              </select>
            </label>
            <label className="text-xs text-bm-muted">
              {w.paymentMethodLabel}
              <select
                className="input-premium mt-1 text-sm py-1.5 min-w-[180px]"
                value={filters.paymentMethod}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    paymentMethod: e.target.value as PaymentMethod | "all",
                  })
                }
              >
                <option value="all">{w.filterAll}</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {pm[m]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <button
          type="button"
          className="text-xs text-bm-red hover:underline self-end pb-2"
          onClick={() => onChange(defaultWorkOrderFilters)}
        >
          {w.filterAll}
        </button>
      </div>
    </div>
  );
}
