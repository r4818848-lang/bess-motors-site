import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import {
  resolveWizardItemIds,
  wizardPrimaryCategory,
  wizardSymptoms,
  type WizardSymptomId,
} from "@/lib/car-problem-wizard";
import { getPriceItem } from "@/lib/price-list";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels, botContentLocale } from "./client-i18n";
import { getClientServiceLabel, normalizeTelegramServiceId } from "./client-services";
import { setClientTelegramSession } from "./client-locale";
import { clientBackMenuRow } from "./client-keyboards";
import { symptomLabel } from "./wizard-symptom-labels";

const CATEGORY_TO_SERVICE: Partial<Record<string, string>> = {
  diagnostic: "diagnostic",
  maintenance: "oil",
  brakes: "brakePads",
  suspension: "suspension",
  ac: "acRefill",
  tires: "tires",
  chip: "otherReason",
  electrical: "electric",
};

export function parseSelectedSymptoms(data: Record<string, string>): WizardSymptomId[] {
  const raw = data.symptoms ?? "";
  return raw.split(",").filter(Boolean) as WizardSymptomId[];
}

export function symptomQuizKeyboard(
  locale: BotLocale,
  selected: WizardSymptomId[]
): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (const s of wizardSymptoms) {
    const on = selected.includes(s.id);
    rows.push([
      {
        text: `${on ? "✅ " : ""}${symptomLabel(s.id, locale)}`,
        callback_data: `cl:sym:${s.id}`,
      },
    ]);
  }
  rows.push([{ text: L.symptomDone, callback_data: "cl:sym:done" }]);
  rows.push(clientBackMenuRow(locale));
  return { inline_keyboard: rows };
}

export function formatSymptomEstimate(
  locale: BotLocale,
  selected: WizardSymptomId[]
): { text: string; serviceId: string; minTotal: number; maxTotal: number } {
  const itemIds = resolveWizardItemIds(selected);
  let minTotal = 0;
  let maxTotal = 0;
  const lines: string[] = [];
  const L = getClientBotLabels(locale);
  const loc = botContentLocale(locale);
  const useRu = loc === "ru";

  for (const id of itemIds.slice(0, 8)) {
    const item = getPriceItem(id);
    if (!item) continue;
    const name = useRu ? item.nameRu : item.namePl;
    const from = item.priceFrom ? L.priceFromPrefix : "";
    const price = item.basePrice;
    minTotal += price;
    maxTotal += price * (item.unit === "per_cylinder" ? 4 : item.unit === "per_wheel" ? 4 : 1);
    lines.push(`• ${name} — ${from}<b>${price}</b> zł`);
  }

  const cat = wizardPrimaryCategory(selected);
  const serviceId = CATEGORY_TO_SERVICE[cat] ?? "diagnostic";

  const title = L.estimateTitle;

  const range = L.estimateRange(minTotal, maxTotal);

  const text = [
    title,
    "",
    ...lines,
    "",
    range,
    "",
    `🔧 ${getClientServiceLabel(serviceId, locale)}`,
  ].join("\n");

  return { text, serviceId, minTotal, maxTotal };
}

export async function startSymptomQuiz(
  chatId: number,
  chatKey: string,
  locale: BotLocale
): Promise<void> {
  const L = getClientBotLabels(locale);
  await setClientTelegramSession(chatKey, {
    step: "client_symptom",
    data: { symptoms: "", locale },
  });
  await sendTelegramMessage(chatId, L.symptomIntro, symptomQuizKeyboard(locale, []));
}

export async function toggleSymptom(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  symptomId: WizardSymptomId,
  messageId?: number
): Promise<void> {
  const { getTelegramSession } = await import("@/lib/server/telegram-sessions");
  const session = await getTelegramSession(chatKey);
  const selected = parseSelectedSymptoms(session.data ?? {});
  const next = selected.includes(symptomId)
    ? selected.filter((x) => x !== symptomId)
    : [...selected, symptomId];

  await setClientTelegramSession(chatKey, {
    step: "client_symptom",
    data: { ...(session.data ?? {}), symptoms: next.join(","), locale },
  });

  const { editTelegramMessage } = await import("@/lib/server/telegram-api");
  const L = getClientBotLabels(locale);
  const kb = symptomQuizKeyboard(locale, next);
  if (messageId) {
    await editTelegramMessage(chatId, messageId, L.symptomIntro, kb);
  } else {
    await sendTelegramMessage(chatId, L.symptomIntro, kb);
  }
}

export async function finishSymptomQuiz(
  chatId: number,
  chatKey: string,
  locale: BotLocale
): Promise<void> {
  const { getTelegramSession } = await import("@/lib/server/telegram-sessions");
  const { clearTelegramSessionKeepLocale } = await import("./client-locale");
  const session = await getTelegramSession(chatKey);
  const selected = parseSelectedSymptoms(session.data ?? {});
  const L = getClientBotLabels(locale);

  if (!selected.length) {
    await sendTelegramMessage(chatId, L.symptomPickOne, symptomQuizKeyboard(locale, []));
    return;
  }

  const est = formatSymptomEstimate(locale, selected);
  const serviceId = normalizeTelegramServiceId(est.serviceId);
  await clearTelegramSessionKeepLocale(chatKey);
  await setClientTelegramSession(chatKey, {
    data: {
      intent: "book",
      serviceId,
      serviceLabel: getClientServiceLabel(serviceId, locale),
      comment: est.text.slice(0, 400),
    },
  });

  await sendTelegramMessage(chatId, est.text, {
    inline_keyboard: [
      [{ text: L.book, callback_data: "cl:book:draft" }],
      [{ text: L.menu, callback_data: "cl:menu" }],
    ],
  });
}
