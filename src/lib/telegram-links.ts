const BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || "BessMotors_bot";

export function telegramBotUrl(startParam?: string): string {
  const base = `https://t.me/${BOT_USERNAME}`;
  if (!startParam) return base;
  return `${base}?start=${encodeURIComponent(startParam)}`;
}
