import { siteConfig } from "./site";
import type { WorkOrder, User } from "./store";

/** Public URL for signing — uses production domain when configured */
export function getSignUrl(orderId: string): string {
  const path = `/sign/${orderId}`;
  const publicBase =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : null;
  if (publicBase) return `${publicBase}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

export function getCabinetOrderUrl(orderId: string): string {
  if (typeof window === "undefined") return `/cabinet?order=${orderId}`;
  return `${window.location.origin}/cabinet?order=${orderId}`;
}

export function buildShareMessage(order: WorkOrder, client: User, lang: "pl" | "ru" = "ru"): string {
  const link = getSignUrl(order.id);
  if (lang === "pl") {
    return `BESS MOTORS — zlecenie ${order.number}\n${client.name}, prosimy o zapoznanie i podpis:\n${link}`;
  }
  return `BESS MOTORS — заказ-наряд ${order.number}\n${client.name}, ознакомьтесь и подпишите:\n${link}`;
}

export function whatsappShareUrl(text: string): string {
  return `${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function telegramShareUrl(text: string): string {
  return `${siteConfig.telegram}?text=${encodeURIComponent(text)}`;
}

export function smsShareUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  return `sms:${digits}?body=${encodeURIComponent(text)}`;
}

export async function fetchClientIp(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(4000) });
    const data = (await res.json()) as { ip?: string };
    return data.ip ?? "unknown";
  } catch {
    return typeof window !== "undefined" ? "local-browser" : "unknown";
  }
}

export function getDeviceInfo(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const w = window.screen?.width ?? 0;
  const h = window.screen?.height ?? 0;
  return `${touch ? "touch" : "desktop"} · ${w}×${h} · ${ua.slice(0, 120)}`;
}

export const SIGNATURE_CONFIRMATION_TEXT =
  "Klient zapoznał się i zgadza się z zakresem prac oraz kosztem naprawy.";

export const SIGNATURE_CONFIRMATION_TEXT_RU =
  "Клиент ознакомлен и согласен с перечнем работ и стоимостью ремонта.";
