import { timingSafeEqual } from "crypto";
import { cleanEnvValue } from "@/lib/server/supabase-config";

export function cronAuthorized(header: string | null): boolean {
  const secret = cleanEnvValue(process.env.CRON_SECRET);
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const got = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}

/**
 * Live Telegram delivery only on the production deployment.
 * Preview, local dev and REMINDER_DELIVERY=disabled do not write CRM or message anyone.
 * REMINDER_DELIVERY=live is ignored on preview so a preview URL cannot use the production database to notify clients.
 */
export function reminderDeliveryEnabled(): boolean {
  const mode = cleanEnvValue(process.env.REMINDER_DELIVERY);
  if (mode === "disabled") return false;
  if (process.env.VERCEL_ENV === "preview") return false;
  if (mode === "live") return true;
  return process.env.VERCEL_ENV === "production";
}

/**
 * Retry of website lead notices. Disabled on its own leaves appointment
 * reminders and a new customer's immediate Telegram message running.
 */
export function leadNoticeDeliveryEnabled(): boolean {
  if (cleanEnvValue(process.env.LEAD_NOTICE_DELIVERY) === "disabled") return false;
  return reminderDeliveryEnabled();
}

/**
 * Calendar writes reach the shared CRM.
 * Production can save. Preview cannot. A local server can save only with
 * STAFF_CALENDAR_WRITES=local, so a laptop holding production keys does not
 * create a real appointment by accident.
 */
export function staffCalendarMutationsEnabled(): boolean {
  const mode = cleanEnvValue(process.env.STAFF_CALENDAR_WRITES);
  if (mode === "disabled") return false;
  if (process.env.VERCEL_ENV === "preview") return false;
  if (process.env.VERCEL_ENV === "production") return true;
  return mode === "local";
}
