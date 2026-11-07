import type { AppSettings, Database, MechanicProfile, WorkOrder } from "@/lib/store";
import {
  calcMechanicEarnings,
  calcServicesSubtotal,
  resolveLaborPercent,
  resolvePartsPercent,
} from "@/lib/workorder-calc";

/** Europe/Warsaw week: Monday 00:00 → Sunday 23:59:59.999 */
export function getWarsawWeekRange(ref = new Date()): { from: Date; to: Date; label: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(ref);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  // Approximate weekday in Warsaw via locale string
  const noonUtcGuess = new Date(Date.UTC(y, m - 1, d, 12));
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Warsaw",
    weekday: "short",
  }).format(noonUtcGuess);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offset = map[weekdayName] ?? 0;
  const from = new Date(Date.UTC(y, m - 1, d - offset, 0, 0, 0));
  const to = new Date(Date.UTC(y, m - 1, d - offset + 6, 23, 59, 59, 999));
  const label = `${fmt.format(from)} — ${fmt.format(to)}`;
  return { from, to, label };
}

export type PayrollLine = {
  date: string;
  orderNumber: string;
  vehicleLabel: string;
  workLabel: string;
  laborGrossIfVat: number;
  laborNetBase: number;
  taxBasis: "net_vat23" | "configured_non_vat" | "net_no_document";
  laborPercent: number;
  amount: number;
  partsIncluded: number;
  adjustment: number;
  notes?: string;
};

export type MechanicPayrollReport = {
  mechanicId: string;
  mechanicName: string;
  weekLabel: string;
  lines: PayrollLine[];
  total: number;
  locked: boolean;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Mechanic wage base:
 * - VAT-enabled order → 50% (configurable) of **labor netto** (never brutto, never parts unless parts% > 0)
 * - Non-VAT order → uses settings.nonVatLaborBasis ('net' default) — payment method is irrelevant
 */
export function calcPayrollLaborBase(
  order: WorkOrder,
  settings: AppSettings
): { base: number; taxBasis: PayrollLine["taxBasis"]; laborGrossIfVat: number } {
  const laborNet = calcServicesSubtotal(order);
  const vatRate = settings.vatRate ?? 23;
  const laborGross = round2(laborNet * (1 + vatRate / 100));
  if (order.vatEnabled) {
    return { base: laborNet, taxBasis: "net_vat23", laborGrossIfVat: laborGross };
  }
  const nonVat = settings.nonVatLaborBasis ?? "net";
  return {
    base: laborNet,
    taxBasis: nonVat === "configured" ? "configured_non_vat" : "net_no_document",
    laborGrossIfVat: laborGross,
  };
}

export function buildMechanicPayroll(
  db: Database,
  mechanicId: string,
  from: Date,
  to: Date
): MechanicPayrollReport {
  const mechanic = db.mechanics.find((m) => m.id === mechanicId);
  const settings = db.settings;
  const lines: PayrollLine[] = [];
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  for (const order of db.workOrders) {
    if (order.status === "cancelled") continue;
    const doneAt = order.completedAt || order.updatedAt || order.createdAt;
    if (doneAt < fromIso || doneAt > toIso) continue;
    // Only closed/delivered count toward payroll by default
    if (order.status !== "delivered" && order.status !== "ready") continue;

    const laborLines = order.services.filter((s) => {
      const mid = s.mechanicId?.trim() || order.mechanicId;
      return mid === mechanicId;
    });
    if (laborLines.length === 0 && order.mechanicId !== mechanicId) continue;

    const subset: WorkOrder = {
      ...order,
      services:
        laborLines.length > 0
          ? laborLines
          : order.mechanicId === mechanicId
            ? order.services
            : [],
    };
    if (subset.services.length === 0) continue;

    const { base, taxBasis, laborGrossIfVat } = calcPayrollLaborBase(subset, settings);
    const laborPercent = resolveLaborPercent(order, mechanic, settings);
    const partsPercent = resolvePartsPercent(order, mechanic, settings);
    const includeParts = (settings.payrollIncludePartsPercent ?? partsPercent) > 0 && partsPercent > 0;
    const earnings = calcMechanicEarnings(subset, settings, mechanic);
    const partsIncluded = includeParts ? earnings.fromParts : 0;
    const amount = round2(base * (laborPercent / 100) + partsIncluded + (mechanic?.bonusPerOrder ?? 0));

    const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
    const vehicleLabel = vehicle
      ? `${vehicle.make} ${vehicle.model} ${vehicle.plate}`.trim()
      : order.vehicleId;

    lines.push({
      date: doneAt.slice(0, 10),
      orderNumber: order.number,
      vehicleLabel,
      workLabel: subset.services.map((s) => s.name).join(", "),
      laborGrossIfVat,
      laborNetBase: base,
      taxBasis,
      laborPercent,
      amount,
      partsIncluded,
      adjustment: 0,
    });
  }

  const lockedWeeks = settings.payrollLockedWeeks ?? [];
  const weekKey = `${fromIso.slice(0, 10)}_${toIso.slice(0, 10)}`;
  return {
    mechanicId,
    mechanicName: mechanic?.name ?? mechanicId,
    weekLabel: `${fromIso.slice(0, 10)} — ${toIso.slice(0, 10)}`,
    lines,
    total: round2(lines.reduce((s, l) => s + l.amount + l.adjustment, 0)),
    locked: lockedWeeks.includes(weekKey),
  };
}

export function buildAllMechanicsPayroll(db: Database, ref = new Date()): MechanicPayrollReport[] {
  const { from, to, label } = getWarsawWeekRange(ref);
  return db.mechanics.map((m) => {
    const r = buildMechanicPayroll(db, m.id, from, to);
    return { ...r, weekLabel: label };
  });
}

/** Example check: brutto 246 → netto 200 → 50% = 100 */
export function exampleVatWage(
  brutto: number,
  vatRate = 23,
  percent = 50
): { netto: number; wage: number } {
  const netto = round2(brutto / (1 + vatRate / 100));
  return { netto, wage: round2(netto * (percent / 100)) };
}
