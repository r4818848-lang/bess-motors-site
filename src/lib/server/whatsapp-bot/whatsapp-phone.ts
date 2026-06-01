import { toWhatsAppRecipient } from "@/lib/server/whatsapp-api";
import type { User } from "@/lib/store";

export function phoneToWaId(phone: string): string {
  return toWhatsAppRecipient(phone);
}

export function phonesMatchWa(a: string, b: string): boolean {
  const da = phoneToWaId(a);
  const db = phoneToWaId(b);
  if (!da || !db) return false;
  if (da === db) return true;
  if (da.length >= 9 && db.length >= 9 && da.slice(-9) === db.slice(-9)) return true;
  return false;
}

/** Prefer linked WA id; optional CRM phone when fallback enabled */
export function resolveWhatsAppRecipient(user: User): string | null {
  if (user.whatsappWaId) return user.whatsappWaId;
  if (process.env.WHATSAPP_ALLOW_PHONE_FALLBACK === "false") return null;
  const digits = phoneToWaId(user.phone);
  return digits.length >= 9 ? digits : null;
}
