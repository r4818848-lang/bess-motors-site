import type { BotLocale } from "./client-i18n";
import { buildReferrerSummary } from "@/lib/referral-system";
import type { Database, User } from "@/lib/store";

export function formatMyRefsCommand(db: Database, user: User, locale: BotLocale): string {
  const summary = buildReferrerSummary(db, user.id);
  if (!summary) {
    return locale === "ru" ? "Нет данных." : "No data.";
  }

  const head =
    locale === "pl"
      ? `🎁 <b>Polecenia:</b> ${summary.qualifiedCount}/${summary.required}`
      : locale === "en"
        ? `🎁 <b>Referrals:</b> ${summary.qualifiedCount}/${summary.required}`
        : `🎁 <b>Рефералы:</b> ${summary.qualifiedCount}/${summary.required}`;

  if (!summary.referred.length) {
    return `${head}\n\n${locale === "ru" ? "Пока никого." : "No referrals yet."}`;
  }

  const lines = summary.referred.slice(0, 10).map((r) => {
    const mark = r.status === "qualified" ? "✅" : r.status === "pending_visit" ? "🔧" : "📝";
    return `${mark} ${r.name}`;
  });

  const footer =
    summary.discountAvailable
      ? locale === "ru"
        ? `\n\n🎉 Скидка 15% активна!`
        : `\n\n🎉 15% discount active!`
      : "";

  return [head, "", ...lines, footer].join("\n");
}
