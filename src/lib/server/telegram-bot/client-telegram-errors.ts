import type { BotLocale } from "./client-i18n";
import { getClientBotLabels } from "./client-i18n";

/** User-facing Telegram bot error from CRM cloud / save failures */
export function formatTelegramSaveError(
  locale: BotLocale,
  error?: string
): string {
  const L = getClientBotLabels(locale);
  if (!error || error === "save_failed" || error === "not_found") {
    return L.saveFailed;
  }
  if (error === "cloud_empty" || error === "cloud_disabled" || error === "cloud_misconfigured") {
    return L.cloudUnavailable;
  }
  if (error === "invalid_credentials") {
    return L.linkInvalidCredentials;
  }
  if (error === "download_failed") {
    return L.photoFailed;
  }
  if (error.length < 120 && !error.includes("{")) {
    return `${L.saveFailed}\n<code>${error}</code>`;
  }
  return L.saveFailed;
}
