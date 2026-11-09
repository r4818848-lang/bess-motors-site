import { calcLineTotal } from "@/lib/booking-cart";
import { getPriceItem } from "@/lib/price-list";
import type { CallRequest, Database, LeadContact, LeadStatus, ServiceLead, SiteLocale } from "@/lib/store";
import { warsawParts } from "@/lib/workshop-schedule";

const LOCALES: SiteLocale[] = ["pl", "uk", "ru", "en"];

export function normalizeSiteLocale(value: unknown): SiteLocale {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "ua") return "uk";
  return LOCALES.includes(raw as SiteLocale) ? (raw as SiteLocale) : "pl";
}

export function siteLocaleLabel(locale: SiteLocale | undefined): string {
  const value = locale ?? "pl";
  return value.toUpperCase();
}

export function missingText(value: string | undefined): string {
  const text = (value ?? "").trim();
  return text || "Не указано";
}

export function quoteService(id: string | undefined, fallbackLabel: string): {
  id?: string;
  label: string;
  priceText: string;
} {
  const label = fallbackLabel.trim();
  const item = id ? getPriceItem(id) : undefined;
  if (!item || !Number.isFinite(item.basePrice) || item.basePrice <= 0) {
    return { id, label: label || "Не указано", priceText: "требует расчёта" };
  }
  return {
    id,
    label: item.nameRu || label || "Не указано",
    priceText: `${item.priceFrom ? "от " : ""}${item.basePrice} zł`,
  };
}

export function quoteSubmittedLine(
  id: string | undefined,
  label: string,
  quantity?: number
): { id?: string; label: string; priceText: string } {
  const item = id ? getPriceItem(id) : undefined;
  const name = label.trim() || item?.nameRu || "Не указано";
  if (!item) return { id, label: name, priceText: "требует расчёта" };
  if (item.unit === "free") return { id: item.id, label: name, priceText: "0 zł" };
  const qty = Math.max(item.minQty ?? 1, Math.min(item.maxQty ?? 99, quantity && quantity > 0 ? quantity : 1));
  const amount = calcLineTotal(item, qty);
  if (!Number.isFinite(amount) || amount <= 0) return { id: item.id, label: name, priceText: "требует расчёта" };
  return { id: item.id, label: name, priceText: `${item.priceFrom ? "от " : ""}${amount} zł` };
}

export function totalQuote(services: { priceText: string }[]): string {
  if (!services.length) return "требует расчёта";
  if (services.some((item) => item.priceText === "требует расчёта")) return "требует расчёта";
  const amounts = services.map((item) => {
    const match = /(\d+(?:[.,]\d+)?)/.exec(item.priceText);
    return match ? Number(match[1].replace(",", ".")) : NaN;
  });
  if (amounts.some((amount) => !Number.isFinite(amount))) return "требует расчёта";
  const prefix = services.some((item) => item.priceText.startsWith("от ")) ? "от " : "";
  return `${prefix}${amounts.reduce((sum, amount) => sum + amount, 0)} zł`;
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export type IncomingLead = {
  id?: string;
  clientRequestId?: string;
  phone: string;
  name?: string;
  make?: string;
  model?: string;
  plate?: string;
  vin?: string;
  serviceId?: string;
  serviceLabel?: string;
  desiredDate?: string;
  desiredTime?: string;
  services?: { id?: string; label?: string; quantity?: number }[];
  siteLocale?: unknown;
  source?: string;
  sourceUrl?: string;
  now?: Date;
};

const OPEN_LEAD_WINDOW_MS = 24 * 60 * 60 * 1000;
export const LEAD_NOTICE_LEASE_MS = 2 * 60 * 1000;
const LEAD_NOTICE_RETRY_MS = 24 * 60 * 60 * 1000;
const LEAD_NOTICE_MAX_ATTEMPTS = 5;

export function leadNoticeEventId(leadId: string): string {
  return `lead-notice:${leadId}`;
}

function normalizedVin(value: string | undefined): string {
  const vin = (value ?? "").replace(/\s/g, "").toUpperCase();
  return vin.length === 17 ? vin : "";
}

function serviceLabelOf(lead: ServiceLead): string {
  return lead.services[0]?.label ?? "";
}

/** Same person, source and request still open. A new VIN or another service stays a separate lead. */
function sameLead(lead: ServiceLead, input: IncomingLead, now: Date): boolean {
  if (input.clientRequestId && lead.clientRequestId === input.clientRequestId) return true;
  if (input.id && (lead.id === input.id || lead.clientRequestId === input.id)) return true;
  const age = now.getTime() - new Date(lead.createdAt).getTime();
  if (!Number.isFinite(age) || age < 0 || age > OPEN_LEAD_WINDOW_MS) return false;
  if (lead.status === "declined" || lead.status === "done" || lead.status === "booked") return false;
  const vin = normalizedVin(input.vin);
  const label = (input.serviceLabel ?? input.services?.[0]?.label ?? "").trim();
  const existingLabel = serviceLabelOf(lead);
  return (
    lead.phone === input.phone &&
    lead.source === (input.source || "website") &&
    (!vin || !lead.vin || vin === lead.vin) &&
    (!label || !existingLabel || label === existingLabel)
  );
}

function inquiryClosed(lead: ServiceLead): boolean {
  return lead.status === "declined" || lead.status === "done" || lead.status === "booked";
}

function openInquiryId(db: Database, input: IncomingLead, now: Date): string {
  const base = websiteInquiryId(input, now);
  const taken = (db.leads ?? []).filter((lead) => lead.id === base || lead.id.startsWith(`${base}-`));
  const open = taken.find((lead) => !inquiryClosed(lead));
  if (open) return open.id;
  if (taken.length === 0) return base;
  return `${base}-${taken.length + 1}`;
}

/** Stable id for one open request, including two POSTs that have not seen each other yet. */
export function websiteInquiryId(input: IncomingLead, now: Date): string {
  if (input.id) return input.id;
  const day = warsawParts(now).dateKey;
  const raw = [
    input.phone,
    input.source || "website",
    normalizedVin(input.vin),
    (input.serviceLabel ?? input.services?.[0]?.label ?? "").trim(),
    day,
  ].join("|");
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `lead-${(hash >>> 0).toString(16).padStart(8, "0")}-${day.replace(/-/g, "")}`;
}

/** Save one lead. A repeated request returns the existing row. */
export function upsertWebsiteLead(db: Database, input: IncomingLead): { lead: ServiceLead; created: boolean } {
  const now = input.now ?? new Date();
  db.leads = db.leads ?? [];
  const existing = db.leads.find((lead) => sameLead(lead, input, now));
  if (existing) return { lead: existing, created: false };

  const names = splitName(input.name ?? "");
  const services = input.services?.length
    ? input.services.map((item) => quoteSubmittedLine(item.id, item.label ?? "", item.quantity))
    : input.serviceId || input.serviceLabel
      ? [quoteService(input.serviceId, input.serviceLabel ?? "")]
      : [];
  const lead: ServiceLead = {
    id: input.id || input.clientRequestId || `lead-${now.getTime()}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    firstName: names.firstName,
    lastName: names.lastName,
    phone: input.phone,
    make: input.make ?? "",
    model: input.model ?? "",
    plate: input.plate ?? "",
    vin: (input.vin ?? "").replace(/\s/g, "").toUpperCase().length === 17
      ? (input.vin ?? "").replace(/\s/g, "").toUpperCase()
      : "",
    services,
    totalText: totalQuote(services),
    desiredDate: input.desiredDate ?? "",
    desiredTime: input.desiredTime ?? "",
    siteLocale: normalizeSiteLocale(input.siteLocale),
    source: input.source || "website",
    sourceUrl: input.sourceUrl || "",
    status: "new",
    managerId: "",
    contacts: [],
    clientRequestId: input.clientRequestId || input.id,
    notifyEventId: leadNoticeEventId(input.id || input.clientRequestId || `lead-${now.getTime()}`),
    notifyStatus: "pending",
    notifyAttempts: 0,
  };
  lead.notifyEventId = leadNoticeEventId(lead.id);
  db.leads.push(lead);
  return { lead, created: true };
}

export function leadNoticeLeaseActive(lead: ServiceLead, now: Date): boolean {
  if (lead.notifyStatus !== "sending") return false;
  const age = now.getTime() - Date.parse(lead.updatedAt);
  return Number.isFinite(age) && age >= 0 && age < LEAD_NOTICE_LEASE_MS;
}

/** Reserve the single Telegram event. A second caller, including another Vercel instance, gets "skip". */
export function claimLeadNotice(lead: ServiceLead, now: Date): "send" | "skip" {
  lead.notifyEventId = leadNoticeEventId(lead.id);
  if (lead.notifyStatus === "sent") return "skip";
  if (leadNoticeLeaseActive(lead, now)) return "skip";
  if ((lead.notifyAttempts ?? 0) >= LEAD_NOTICE_MAX_ATTEMPTS) return "skip";
  const age = now.getTime() - Date.parse(lead.createdAt);
  if (!Number.isFinite(age) || age < 0 || age > LEAD_NOTICE_RETRY_MS) return "skip";
  lead.notifyStatus = "sending";
  lead.notifyAttempts = (lead.notifyAttempts ?? 0) + 1;
  lead.updatedAt = now.toISOString();
  return "send";
}

/** Telegram failure returns the event to pending so a later attempt can send it once. */
export function completeLeadNotice(lead: ServiceLead, delivered: boolean, now: Date): void {
  if (lead.notifyStatus === "sent") return;
  lead.notifyEventId = leadNoticeEventId(lead.id);
  lead.notifyStatus = delivered ? "sent" : "pending";
  lead.updatedAt = now.toISOString();
}

export type WebsiteInquiryInput = IncomingLead & {
  serviceId?: string;
  serviceLabel?: string;
  comment?: string;
  priority?: "normal" | "urgent";
};

/** One open inquiry: one lead, one call request, and at most one reserved notification. */
export function acceptWebsiteInquiry(
  db: Database,
  input: WebsiteInquiryInput,
  now = input.now ?? new Date()
): { lead: ServiceLead; created: boolean; callCreated: boolean; decision: "send" | "skip" } {
  const saved = upsertWebsiteLead(db, { ...input, id: openInquiryId(db, input, now), now });
  db.callRequests = db.callRequests ?? [];
  const callId = `call-${saved.lead.id}`;
  const callExists = db.callRequests.some((call) => call.id === callId);
  if (!callExists && saved.created) {
    const call: CallRequest = {
      id: callId,
      phone: input.phone,
      clientName: input.name?.trim() || undefined,
      serviceId: input.serviceId ?? "",
      serviceLabel: input.serviceLabel ?? serviceLabelOf(saved.lead),
      comment: input.comment ?? "",
      userId: "guest",
      status: "needs_call",
      source: "website",
      createdAt: now.toISOString(),
      priority: input.priority ?? "normal",
      marketing: input.source && input.source !== "website" ? { utmSource: input.source } : undefined,
    };
    db.callRequests.push(call);
  }
  return {
    lead: saved.lead,
    created: saved.created,
    callCreated: saved.created && !callExists,
    decision: saved.created ? claimLeadNotice(saved.lead, now) : "skip",
  };
}

export type LeadAction = "confirm_call" | "confirm_sms" | "no_answer" | "callback" | "decline" | "done" | "booked";

export function applyLeadAction(lead: ServiceLead, action: LeadAction, now: Date, managerId = ""): void {
  lead.updatedAt = now.toISOString();
  if (managerId) lead.managerId = managerId;
  const push = (kind: LeadContact["kind"]) => {
    lead.contacts = [
      ...(lead.contacts ?? []),
      { id: `contact-${now.getTime()}-${kind}`, kind, at: now.toISOString(), managerId: managerId || undefined },
    ];
  };
  if (action === "confirm_call" || action === "confirm_sms") {
    if (lead.status === "new") lead.status = "processing";
    push(action === "confirm_sms" ? "sms" : "call");
    return;
  }
  if (action === "no_answer") {
    lead.status = "no_answer";
    push("no_answer");
    return;
  }
  if (action === "callback") {
    lead.status = "processing";
    push("callback");
    return;
  }
  if (action === "decline") {
    lead.status = "declined";
    push("decline");
    return;
  }
  if (action === "done") {
    lead.status = "done";
    push("done");
    return;
  }
  lead.status = "booked";
  push("booked");
}

export function leadStatusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    new: "Новые",
    processing: "В обработке",
    booked: "Записаны",
    no_answer: "Не дозвонились",
    declined: "Отказались",
    done: "Обработанные",
  };
  return labels[status];
}

export function formatLeadMessage(lead: ServiceLead): string {
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  const car = [lead.make, lead.model].filter(Boolean).join(" ");
  const services = lead.services.length
    ? lead.services.map((item) => `${item.label}: ${item.priceText}`).join("\n")
    : "Не указано";
  return [
    "<b>Новая заявка</b>",
    `ID: <code>${lead.id}</code>`,
    `Время: ${lead.createdAt}`,
    `Клиент: <b>${missingText(name)}</b>`,
    `Телефон: <b>${missingText(lead.phone)}</b>`,
    `Авто: ${missingText(car)}`,
    `Номер: ${missingText(lead.plate)}`,
    `VIN: ${lead.vin ? `<code>${lead.vin}</code>` : "Не указано"}`,
    `Услуги:\n${services}`,
    `Предварительно: ${lead.totalText}`,
    `Желаемое: ${missingText(lead.desiredDate)} ${missingText(lead.desiredTime)}`.trim(),
    `Язык сайта: ${siteLocaleLabel(lead.siteLocale)}`,
    `Источник: ${missingText(lead.source)}`,
    lead.sourceUrl ? `Форма: ${lead.sourceUrl}` : "Форма: Не указано",
  ].join("\n");
}
