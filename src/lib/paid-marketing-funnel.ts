import type { Appointment, Database, MarketingAttributionFields, ServiceLead } from "./store";
import { calcClientTotal } from "./workorder-calc";

/**
 * Acquisition-cohort report. It never guesses that two customers are the same
 * from their phone, name or vehicle. Bookings and paid orders must be connected
 * via an explicit CRM id. Paid work orders are counted once.
 */
export interface PaidMarketingFunnelRow {
  source: string;
  inquiries: number;
  bookings: number;
  confirmedBookings: number;
  arrivals: number;
  paidOrders: number;
  /** CRM line totals before any VAT applied separately by the invoice module. */
  paidRevenue: number;
}

export const UNKNOWN_MARKETING_SOURCE = "unknown";

function channel(row: MarketingAttributionFields | null | undefined): string {
  const m = row?.marketing;
  if (!m?.utmSource) return UNKNOWN_MARKETING_SOURCE;
  return [m.utmSource, m.utmMedium, m.utmCampaign].filter(Boolean).join(" / ");
}

function eligibleWebsiteLead(lead: ServiceLead): boolean {
  // Manual and messaging channels must not inflate untagged website requests.
  const nonWeb = new Set(["telegram", "manual", "crm", "admin", "staff", "office"]);
  return Boolean(lead.marketing?.utmSource) || !nonWeb.has((lead.source || "").toLowerCase());
}

function acquisitionSourceForAppointment(
  appointment: Appointment,
  linkedLeads: ServiceLead[]
): string {
  const first = channel(appointment);
  if (first !== UNKNOWN_MARKETING_SOURCE) return first;
  const linkedSources = new Set(
    linkedLeads.map((lead) => channel(lead)).filter((src) => src !== UNKNOWN_MARKETING_SOURCE)
  );
  // Conflicting campaigns do not get credited to one arbitrary source.
  return linkedSources.size === 1 ? [...linkedSources][0] : UNKNOWN_MARKETING_SOURCE;
}

export function buildPaidMarketingFunnel(
  db: Database,
  createdInPeriod: (createdAt: string) => boolean
): PaidMarketingFunnelRow[] {
  const map = new Map<string, PaidMarketingFunnelRow>();
  const ensure = (source: string): PaidMarketingFunnelRow => {
    const existing = map.get(source);
    if (existing) return existing;
    const row: PaidMarketingFunnelRow = {
      source,
      inquiries: 0,
      bookings: 0,
      confirmedBookings: 0,
      arrivals: 0,
      paidOrders: 0,
      paidRevenue: 0,
    };
    map.set(source, row);
    return row;
  };

  const uniqueLeads = new Map((db.leads ?? []).map((lead) => [lead.id, lead]));
  const appointmentIndex = new Map(db.appointments.map((apt) => [apt.id, apt]));
  const leadsByAppointment = new Map<string, ServiceLead[]>();
  for (const lead of uniqueLeads.values()) {
    if (lead.appointmentId && appointmentIndex.has(lead.appointmentId)) {
      const rows = leadsByAppointment.get(lead.appointmentId) ?? [];
      rows.push(lead);
      leadsByAppointment.set(lead.appointmentId, rows);
    }
  }
  for (const appointment of db.appointments) {
    if (!appointment.leadId) continue;
    const lead = uniqueLeads.get(appointment.leadId);
    if (!lead) continue;
    const rows = leadsByAppointment.get(appointment.id) ?? [];
    if (!rows.some((row) => row.id === lead.id)) rows.push(lead);
    leadsByAppointment.set(appointment.id, rows);
  }

  // Created CRM inquiries are unique by lead id; duplicated callRequest rows
  // are deliberately not included.
  for (const lead of uniqueLeads.values()) {
    if (!eligibleWebsiteLead(lead) || !createdInPeriod(lead.createdAt)) continue;
    let source = channel(lead);
    if (source === UNKNOWN_MARKETING_SOURCE && lead.appointmentId) {
      source = channel(appointmentIndex.get(lead.appointmentId));
    }
    ensure(source).inquiries += 1;
  }

  const eligible = new Map<string, { apt: Appointment; source: string }>();
  for (const apt of db.appointments) {
    const linkedLeads = leadsByAppointment.get(apt.id) ?? [];
    if (apt.source !== "website" && !apt.marketing?.utmSource && !linkedLeads.some(eligibleWebsiteLead)) continue;
    if (!createdInPeriod(apt.createdAt) || apt.appointmentStatus === "cancelled") continue;
    const source = acquisitionSourceForAppointment(apt, linkedLeads);
    eligible.set(apt.id, { apt, source });
    const row = ensure(source);
    row.bookings += 1;
    if (["confirmed", "in_progress", "completed"].includes(apt.appointmentStatus)) {
      row.confirmedBookings += 1;
    }
    // Only the explicit CRM arrival marker proves the car actually arrived.
    if (apt.visitState === "arrived") row.arrivals += 1;
  }

  const orders = new Map(db.workOrders.map((order) => [order.id, order]));
  const ordersWithSources = new Map<string, Set<string>>();
  for (const { apt, source } of eligible.values()) {
    if (!apt.workOrderId || orders.get(apt.workOrderId)?.paymentStatus !== "paid") continue;
    const sourceSet = ordersWithSources.get(apt.workOrderId) ?? new Set<string>();
    sourceSet.add(source);
    ordersWithSources.set(apt.workOrderId, sourceSet);
  }
  for (const [orderId, sources] of ordersWithSources) {
    const order = orders.get(orderId);
    if (!order) continue;
    const source = sources.size === 1 ? [...sources][0] : UNKNOWN_MARKETING_SOURCE;
    const row = ensure(source);
    row.paidOrders += 1;
    row.paidRevenue += calcClientTotal(order);
  }

  return [...map.values()].sort(
    (a, b) =>
      b.paidRevenue - a.paidRevenue ||
      b.inquiries + b.bookings - a.inquiries - a.bookings ||
      a.source.localeCompare(b.source)
  );
}
