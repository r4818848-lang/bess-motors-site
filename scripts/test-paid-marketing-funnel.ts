import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPaidMarketingFunnel, UNKNOWN_MARKETING_SOURCE } from "../src/lib/paid-marketing-funnel";
import { mergeStoredDb, type Appointment, type ServiceLead, type WorkOrder } from "../src/lib/store";
import { computeCrmAnalytics, exportReportsCsv } from "../src/lib/crm-analytics";

const makeLead = (id: string, source: string, appointmentId?: string, channel?: string): ServiceLead => ({
  id,
  createdAt: "2026-11-18T09:00:00Z",
  updatedAt: "2026-11-18T09:00:00Z",
  firstName: "Test",
  lastName: "Client",
  phone: "+48111000000",
  make: "",
  model: "",
  plate: "",
  vin: "",
  services: [],
  totalText: "",
  desiredDate: "",
  desiredTime: "",
  siteLocale: "pl",
  source,
  sourceUrl: "/booking",
  status: appointmentId ? "booked" : "new",
  managerId: "",
  contacts: [],
  appointmentId,
  marketing: channel ? { utmSource: channel, utmMedium: "organic" } : undefined,
  notifyStatus: "pending",
  notifyAttempts: 0,
});
const makeAppointment = (id: string, workOrderId?: string, channel?: string): Appointment => ({
  id,
  userId: "customer-1",
  vehicleId: "car-1",
  serviceIds: ["brakes"],
  date: "2026-11-20",
  time: "10:00",
  mechanicId: "mech-1",
  repairStatus: "delivered",
  appointmentStatus: "confirmed",
  comment: "",
  source: "website",
  createdAt: "2026-11-18T09:02:00Z",
  workOrderId,
  marketing: channel ? { utmSource: channel, utmMedium: "organic" } : undefined,
});
const makeOrder = (id: string, paymentStatus: "paid" | "unpaid" = "paid"): WorkOrder => ({
  id,
  number: "BESS/2026/TEST",
  userId: "customer-1",
  vehicleId: "car-1",
  status: "delivered",
  services: [{ id: "s", name: "Brakes", price: 300, qty: 1, discount: 0 }],
  parts: [{ id: "p", name: "Part", qty: 1, purchasePrice: 20, sellPrice: 50, discount: 0 }],
  orderDiscount: 0,
  paymentStatus,
  createdAt: "2026-11-20T14:00:00Z",
  updatedAt: "2026-11-20T15:00:00Z",
} as WorkOrder);
const inPeriod = (createdAt: string) => createdAt.startsWith("2026-11-18");

const a1 = makeAppointment("apt-1", "order-1");
a1.visitState = "arrived";
const db = mergeStoredDb({
  leads: [makeLead("lead-1", "contacts_form", "apt-1", "google-gmb")],
  appointments: [a1, makeAppointment("apt-2", "order-unpaid", "chatgpt")],
  workOrders: [makeOrder("order-1"), makeOrder("order-unpaid", "unpaid"), makeOrder("orphan-paid")],
  // One call request is automatically mirrored from a lead; do not double count.
  callRequests: [{ id: "call-lead-1", source: "website", phone: "+48111000000", userId: "guest", serviceId: "", serviceLabel: "Brakes", comment: "", status: "needs_call", createdAt: "2026-11-18T09:00:00Z" }],
});
const rows = buildPaidMarketingFunnel(db, inPeriod);
const google = rows.find((r) => r.source === "google-gmb / organic");
const ai = rows.find((r) => r.source === "chatgpt / organic");
assert.deepEqual(google, {
  source: "google-gmb / organic",
  inquiries: 1,
  bookings: 1,
  confirmedBookings: 1,
  arrivals: 1,
  paidOrders: 1,
  paidRevenue: 350,
});
assert.equal(ai?.bookings, 1);
assert.equal(ai?.arrivals, 0, "confirmed does not imply car arrival");
assert.equal(ai?.paidOrders, 0, "linked but unpaid order is not revenue");
assert.equal(rows.reduce((v, row) => v + row.paidOrders, 0), 1, "unlinked order cannot inflate results");
assert.equal(rows.reduce((v, row) => v + row.inquiries, 0), 1, "callRequest duplicate is ignored");

const ambiguous = mergeStoredDb({
  leads: [makeLead("lead-a", "website", "apt-a", "chatgpt"), makeLead("lead-b", "website", "apt-b", "perplexity")],
  appointments: [makeAppointment("apt-a", "same-order"), makeAppointment("apt-b", "same-order")],
  workOrders: [makeOrder("same-order")],
});
const conflict = buildPaidMarketingFunnel(ambiguous, inPeriod);
assert.equal(conflict.reduce((n, r) => n + r.paidOrders, 0), 1);
assert.equal(conflict.find((r) => r.source === UNKNOWN_MARKETING_SOURCE)?.paidOrders, 1, "conflicting channels must not be guessed");

const fallback = mergeStoredDb({
  leads: [makeLead("lead-c", "website", "apt-c")],
  appointments: [makeAppointment("apt-c")],
  workOrders: [],
});
const missing = buildPaidMarketingFunnel(fallback, inPeriod).find((r) => r.source === UNKNOWN_MARKETING_SOURCE);
assert.equal(missing?.inquiries, 1);
assert.equal(missing?.bookings, 1);
const nonWeb = mergeStoredDb({ leads: [makeLead("lead-telegram", "telegram")], appointments: [], workOrders: [] });
assert.equal(buildPaidMarketingFunnel(nonWeb, inPeriod).length, 0);

const stats = computeCrmAnalytics(db, "custom", "2026-11-18", "2026-11-18");
assert.equal(stats.paidMarketingFunnel.find((r) => r.source === "google-gmb / organic")?.paidRevenue, 350);
const csv = exportReportsCsv(db, stats, "test");
assert.match(csv, /Marketing – kohorta/);
assert.match(csv, /google-gmb \/ organic;1;1;1;1;1;350\.00/);
const ui = readFileSync("src/components/crm/CrmExtendedReports.tsx", "utf8");
assert.match(ui, /stats\.paidMarketingFunnel\.map/);
console.log("CRM paid marketing funnel: explicit links, paid status, arrival, no double credit, multilingual UI and CSV OK");
