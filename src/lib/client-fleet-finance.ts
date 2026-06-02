import type { ClientPortalSlice } from "@/lib/client-sign";
import type { Vehicle, WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";

export type FleetUnpaidOrder = {
  id: string;
  number: string;
  total: number;
  status: string;
  createdAt: string;
};

export type VehicleFinanceRow = {
  vehicleId: string;
  plate: string;
  makeModel: string;
  orderCount: number;
  totalAll: number;
  paidTotal: number;
  unpaidTotal: number;
  unpaidOrders: FleetUnpaidOrder[];
};

export type FleetFinanceSummary = {
  vehicles: VehicleFinanceRow[];
  grandTotal: number;
  grandPaid: number;
  grandUnpaid: number;
  unpaidOrderCount: number;
  paidOrderCount: number;
};

function makeModel(v: Vehicle): string {
  return `${v.make} ${v.model}`.trim() || "—";
}

function isBillableOrder(o: WorkOrder): boolean {
  return calcClientTotal(o) > 0 || o.services.length > 0 || o.parts.length > 0;
}

export function buildFleetFinance(slice: ClientPortalSlice): FleetFinanceSummary {
  const billable = slice.workOrders.filter(isBillableOrder);
  const vehicleIds = new Set(slice.vehicles.map((v) => v.id));
  const orphanVehicleId = "__unassigned__";

  const rows = new Map<string, VehicleFinanceRow>();

  for (const v of slice.vehicles) {
    rows.set(v.id, {
      vehicleId: v.id,
      plate: v.plate?.trim() || "—",
      makeModel: makeModel(v),
      orderCount: 0,
      totalAll: 0,
      paidTotal: 0,
      unpaidTotal: 0,
      unpaidOrders: [],
    });
  }

  const ensureRow = (vehicleId: string, order: WorkOrder): VehicleFinanceRow => {
    let row = rows.get(vehicleId);
    if (!row) {
      const v = slice.vehicles.find((x) => x.id === vehicleId);
      row = {
        vehicleId,
        plate: v?.plate?.trim() || "—",
        makeModel: v ? makeModel(v) : "—",
        orderCount: 0,
        totalAll: 0,
        paidTotal: 0,
        unpaidTotal: 0,
        unpaidOrders: [],
      };
      rows.set(vehicleId, row);
    }
    return row;
  };

  for (const o of billable) {
    const vid =
      o.vehicleId && vehicleIds.has(o.vehicleId) ? o.vehicleId : orphanVehicleId;
    const row = ensureRow(vid, o);
    const total = calcClientTotal(o);
    row.orderCount += 1;
    row.totalAll += total;
    if (o.paymentStatus === "paid") {
      row.paidTotal += total;
    } else {
      row.unpaidTotal += total;
      row.unpaidOrders.push({
        id: o.id,
        number: o.number,
        total,
        status: o.status,
        createdAt: o.createdAt,
      });
    }
  }

  const vehicles = [...rows.values()]
    .filter((r) => r.orderCount > 0 || slice.vehicles.some((v) => v.id === r.vehicleId))
    .sort((a, b) => {
      if (b.unpaidTotal !== a.unpaidTotal) return b.unpaidTotal - a.unpaidTotal;
      return a.plate.localeCompare(b.plate, "pl");
    });

  let grandTotal = 0;
  let grandPaid = 0;
  let grandUnpaid = 0;
  let unpaidOrderCount = 0;
  let paidOrderCount = 0;

  for (const o of billable) {
    const total = calcClientTotal(o);
    grandTotal += total;
    if (o.paymentStatus === "paid") {
      grandPaid += total;
      paidOrderCount += 1;
    } else {
      grandUnpaid += total;
      unpaidOrderCount += 1;
    }
  }

  return {
    vehicles,
    grandTotal,
    grandPaid,
    grandUnpaid,
    unpaidOrderCount,
    paidOrderCount,
  };
}
