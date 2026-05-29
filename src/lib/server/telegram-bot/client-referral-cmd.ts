import type { BotLocale } from "./client-i18n";
import { getClientBotLabels } from "./client-i18n";
import { buildReferrerSummary } from "@/lib/referral-system";
import type { Database, User } from "@/lib/store";

export function formatMyRefsCommand(db: Database, user: User, locale: BotLocale): string {
  const L = getClientBotLabels(locale);
  const summary = buildReferrerSummary(db, user.id);
  if (!summary) {
    return L.referralNoData;
  }

  const head = L.referralHeadCount(summary.qualifiedCount, summary.required);

  if (!summary.referred.length) {
    return `${head}\n\n${L.referralEmpty}`;
  }

  const lines = summary.referred.slice(0, 10).map((r) => {
    const mark = r.status === "qualified" ? "✅" : r.status === "pending_visit" ? "🔧" : "📝";
    return `${mark} ${r.name}`;
  });

  const footer = summary.discountAvailable ? L.referralDiscountActive : "";

  return [head, "", ...lines, footer].join("\n");
}
