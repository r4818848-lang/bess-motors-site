import {
  buildReferrerSummary,
  REFERRAL_QUALIFIED_REQUIRED,
  REFERRAL_REWARD_DISCOUNT_PERCENT,
} from "@/lib/referral-system";
import type { BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { Database, User } from "@/lib/store";

function referralProgressText(locale: BotLocale, summary: ReturnType<typeof buildReferrerSummary>): string {
  if (!summary) return "";
  const { qualifiedCount, required, rewardPercent, discountAvailable, discountUsed } = summary;

  if (locale === "pl") {
    return [
      "🎁 <b>Program poleceń</b>",
      "",
      `✅ Potwierdzeni znajomi: <b>${qualifiedCount}</b> / ${required}`,
      "Warunek: opłacone i wydane zlecenie w serwisie.",
      "",
      discountUsed
        ? "ℹ️ Rabat 15% został już wykorzystany."
        : discountAvailable
          ? `🎉 <b>Masz ${rewardPercent}% rabatu</b> na następne zlecenie!`
          : qualifiedCount >= required
            ? `🎉 Odbierz ${rewardPercent}% rabatu w kabinecie lub u doradcy.`
            : `Do rabatu ${rewardPercent}% brakuje: <b>${required - qualifiedCount}</b> znajomych.`,
    ].join("\n");
  }

  if (locale === "en") {
    return [
      "🎁 <b>Referral program</b>",
      "",
      `✅ Confirmed friends: <b>${qualifiedCount}</b> / ${required}`,
      "Rule: paid & delivered work order.",
      "",
      discountAvailable
        ? `🎉 <b>${rewardPercent}% discount</b> on your next visit!`
        : `Need <b>${Math.max(0, required - qualifiedCount)}</b> more for ${rewardPercent}%.`,
    ].join("\n");
  }

  return [
    "🎁 <b>Реферальная программа</b>",
    "",
    `✅ Подтверждённых друзей: <b>${qualifiedCount}</b> / ${required}`,
    "Условие: оплаченный и закрытый (выдан) заказ-наряд в сервисе.",
    "",
    discountUsed
      ? "ℹ️ Скидка 15% уже использована."
      : discountAvailable
        ? `🎉 <b>Скидка ${rewardPercent}%</b> на следующий визит!`
        : `До скидки ${rewardPercent}% осталось: <b>${Math.max(0, required - qualifiedCount)}</b> друзей.`,
  ].join("\n");
}

export function formatReferralTelegramMessage(
  db: Database,
  user: User,
  locale: BotLocale,
  link: string
): string {
  const summary = buildReferrerSummary(db, user.id);
  if (!summary) {
    return locale === "ru"
      ? `🎁 Приглашайте друзей:\n${link}`
      : `🎁 Refer friends:\n${link}`;
  }

  const list = summary.referred.slice(0, 8).map((r) => {
    const mark =
      r.status === "qualified" ? "✅" : r.status === "pending_visit" ? "🔧" : "📝";
    const extra =
      r.status === "qualified" && r.qualifyingOrderNumber
        ? ` · ${r.qualifyingOrderNumber}`
        : "";
    return `${mark} ${r.name}${extra}`;
  });

  const lines = [
    referralProgressText(locale, summary),
    "",
    locale === "ru" ? "Ваша ссылка:" : locale === "pl" ? "Twój link:" : "Your link:",
    link,
  ];

  if (list.length) {
    lines.push("", locale === "ru" ? "<b>Кого привели:</b>" : "<b>Poleceni:</b>", ...list);
  }

  return lines.join("\n");
}

export async function notifyAdminReferralUnlocked(
  db: Database,
  referrer: User
): Promise<void> {
  const { notifyAdminTelegram } = await import("@/lib/server/telegram-api");
  const summary = buildReferrerSummary(db, referrer.id);
  await notifyAdminTelegram(
    [
      "🎁 <b>Реферал: скидка 15% разблокирована</b>",
      "",
      `👤 ${referrer.name} · ${referrer.phone}`,
      `✅ Подтверждено: ${summary?.qualifiedCount ?? 0} / ${REFERRAL_QUALIFIED_REQUIRED}`,
      "",
      "Примените в CRM: «Zastosuj 15% rabat» w zleceniu klienta.",
    ].join("\n")
  );
}

export async function notifyReferrerRewardTelegram(
  db: Database,
  referrerId: string
): Promise<void> {
  const user = db.users.find((u) => u.id === referrerId && u.role === "client");
  if (!user?.telegramChatId) return;
  const loc: BotLocale = user.telegramLocale ?? "ru";
  const text =
    loc === "pl"
      ? `🎉 Gratulacje! Masz ${REFERRAL_QUALIFIED_REQUIRED} potwierdzonych poleceń — <b>${REFERRAL_REWARD_DISCOUNT_PERCENT}% rabatu</b> na kolejne zlecenie.`
      : loc === "en"
        ? `🎉 You unlocked <b>${REFERRAL_REWARD_DISCOUNT_PERCENT}% off</b> your next order!`
        : `🎉 У вас ${REFERRAL_QUALIFIED_REQUIRED} подтверждённых рефералов — <b>скидка ${REFERRAL_REWARD_DISCOUNT_PERCENT}%</b> на следующий визит!`;
  await sendTelegramMessage(user.telegramChatId, text);
}

import {
  isReferralQualifiedWorkOrder,
  recomputeReferrerFromDb,
} from "@/lib/referral-system";
import type { WorkOrder } from "@/lib/store";
/** Telegram alerts after CRM/bot marks order paid+delivered (in-app handled in browser). */
export async function runReferralTelegramEffects(
  db: import("@/lib/store").Database,
  order: WorkOrder,
  previous?: WorkOrder | null
): Promise<void> {
  if (!isReferralQualifiedWorkOrder(order)) return;
  if (previous && isReferralQualifiedWorkOrder(previous)) return;

  const client = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!client?.referredByUserId) return;

  const result = recomputeReferrerFromDb(db, client.referredByUserId);
  if (!result) return;

  await notifyReferrerFriendQualifiedTelegram(db, client.referredByUserId, client.name);
  if (result.justUnlocked) {
    await notifyReferrerRewardTelegram(db, client.referredByUserId);
    await notifyAdminReferralUnlocked(db, result.referrer);
  }
}

export async function notifyReferrerFriendQualifiedTelegram(
  db: Database,
  referrerId: string,
  referredName: string
): Promise<void> {
  const user = db.users.find((u) => u.id === referrerId && u.role === "client");
  if (!user?.telegramChatId) return;
  const summary = buildReferrerSummary(db, referrerId);
  if (!summary) return;
  const loc: BotLocale = user.telegramLocale ?? "ru";
  const text =
    loc === "pl"
      ? `✅ <b>${referredName}</b> — zlecenie opłacone i wydane.\nPostęp: ${summary.qualifiedCount}/${summary.required}.`
      : loc === "en"
        ? `✅ <b>${referredName}</b> completed a paid visit.\nProgress: ${summary.qualifiedCount}/${summary.required}.`
        : `✅ <b>${referredName}</b> — оплаченный закрытый заказ-наряд.\nПрогресс: ${summary.qualifiedCount}/${summary.required}.`;
  await sendTelegramMessage(user.telegramChatId, text);
}
