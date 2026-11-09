/**
 * Report whether release settings are present. Never prints secret values.
 * A missing name in this environment is not a production result.
 */
const SECRET_NAMES = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "TELEGRAM_ADMIN_CHAT_IDS",
  "CRON_SECRET",
] as const;

const FLAG_NAMES = [
  "VERCEL_ENV",
  "REMINDER_DELIVERY",
  "LEAD_NOTICE_DELIVERY",
  "SMART_WORK_SCHEDULER",
  "SCHEDULER_UNIFIED_CALENDAR",
  "SCHEDULER_TEST_WRITES",
  "SCHEDULER_READ_ONLY_PILOT",
  "SCHEDULER_CRM_SOURCE",
] as const;

const SAFE_FLAG = /^(disabled|live|true|false|on|off|local|cloud|production|preview|production-readonly)$/;

function line(name: string, secret: boolean): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) return `${name}: missing`;
  if (!secret && SAFE_FLAG.test(value)) return `${name}: ${value}`;
  return `${name}: present`;
}

for (const name of SECRET_NAMES) console.log(line(name, true));
for (const name of FLAG_NAMES) console.log(line(name, false));
