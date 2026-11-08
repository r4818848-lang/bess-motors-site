import { calcLineTotal } from "@/lib/booking-cart";
import { getPriceItem } from "@/lib/price-list";
import type { Database, LeadContact, LeadStatus, ServiceLead, SiteLocale } from "@/lib/store";

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

function sameLead(lead: ServiceLead, input: IncomingLead, now: Date): boolean {
  if (input.clientRequestId && lead.clientRequestId === input.clientRequestId) return true;
  if (input.id && lead.id === input.id) return true;
  const age = now.getTime() - new Date(lead.createdAt).getTime();
  return (
    age >= 0 &&
    age < 2 * 60 * 1000 &&
    lead.phone === input.phone &&
    lead.source === (input.source || "website") &&
    lead.desiredDate === (input.desiredDate ?? "") &&
    lead.desiredTime === (input.desiredTime ?? "") &&
    lead.status !== "declined"
  );
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
    notifyStatus: "pending",
    notifyAttempts: 0,
  };
  db.leads.push(lead);
  return { lead, created: true };
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
