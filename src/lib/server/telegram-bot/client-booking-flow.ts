import type { ClientPortalSlice } from "@/lib/client-sign";
import { sendTelegramMessage, updateTelegramInlineScreen } from "@/lib/server/telegram-api";
import { type BotLocale, getClientBotLabels } from "./client-i18n";
import {
  clientConfirmBookingKeyboard,
  clientConfirmCallKeyboard,
  clientCustomServiceConfirmKeyboard,
  clientDateKeyboard,
  clientMainKeyboard,
  clientServiceCategoryKeyboard,
  clientServiceOptionsKeyboard,
  clientSkipCommentKeyboard,
  clientTimeKeyboard,
  formatClientBookingSummary,
} from "./client-keyboards";
import { setClientTelegramSession, clearTelegramSessionKeepLocale } from "./client-locale";
import {
  buildTelegramServiceLabel,
  getCategorySubOptions,
  hasMultipleSubOptions,
} from "./client-service-menu";
import { formatDateShort, getClientServiceLabel, normalizeTelegramServiceId } from "./client-services";

type ReplyKeyboard = Parameters<typeof sendTelegramMessage>[2];

export async function replyOrEdit(
  chatId: number,
  messageId: number | undefined,
  locale: BotLocale,
  text: string,
  keyboard?: ReplyKeyboard
): Promise<void> {
  const inlineKb =
    keyboard && "inline_keyboard" in keyboard ? keyboard : clientMainKeyboard(locale);
  if (messageId || (keyboard && "inline_keyboard" in keyboard)) {
    await updateTelegramInlineScreen(chatId, messageId, text, inlineKb);
    return;
  }
  await sendTelegramMessage(chatId, text, keyboard ?? clientMainKeyboard(locale));
}

export function linkedProfileData(
  slice: ClientPortalSlice | null | undefined,
  data: Record<string, string>
): Record<string, string> {
  if (!slice?.user) return data;
  const next = { ...data };
  if (slice.user.name?.trim()) next.name = slice.user.name.trim();
  if (slice.user.phone?.trim()) next.phone = slice.user.phone.trim();
  return next;
}

export async function showConfirm(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  data: Record<string, string>
): Promise<void> {
  const intent = data.intent === "call" ? "call" : "book";
  const summary = formatClientBookingSummary(locale, data);
  const keyboard =
    intent === "call"
      ? clientConfirmCallKeyboard(locale)
      : clientConfirmBookingKeyboard(locale);
  await setClientTelegramSession(chatKey, { step: undefined, data });
  await replyOrEdit(chatId, messageId, locale, summary, keyboard);
}

export async function promptName(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  intent: "book" | "call",
  data: Record<string, string>
): Promise<void> {
  const L = getClientBotLabels(locale);
  await setClientTelegramSession(chatKey, {
    step: "client_name",
    data: { ...data, intent },
  });
  await replyOrEdit(chatId, messageId, locale, L.enterName, {
    inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]],
  });
}

export async function promptPhone(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  data: Record<string, string>
): Promise<void> {
  const L = getClientBotLabels(locale);
  await setClientTelegramSession(chatKey, { step: "client_phone", data });
  await replyOrEdit(chatId, messageId, locale, L.enterPhone, {
    inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]],
  });
}

export async function promptCustomService(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  intent: "book" | "call"
): Promise<void> {
  const L = getClientBotLabels(locale);
  await setClientTelegramSession(chatKey, {
    step: "client_custom_service",
    data: { intent },
  });
  await replyOrEdit(chatId, messageId, locale, L.enterCustomService, {
    inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]],
  });
}

export async function showCustomServiceConfirm(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  data: Record<string, string>
): Promise<void> {
  const L = getClientBotLabels(locale);
  const text = data.customServiceText?.trim() ?? "";
  await setClientTelegramSession(chatKey, {
    step: "client_custom_confirm",
    data,
  });
  await replyOrEdit(
    chatId,
    messageId,
    locale,
    L.confirmCustomService(text),
    clientCustomServiceConfirmKeyboard(locale)
  );
}

export async function continueWithServiceSelection(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  intent: "book" | "call",
  categoryId: string,
  optionId: string,
  slice: ClientPortalSlice | null | undefined
): Promise<void> {
  const serviceId = normalizeTelegramServiceId(categoryId);
  const serviceLabel = buildTelegramServiceLabel(categoryId, optionId, locale);
  const nextData = { intent, serviceId, serviceLabel };
  if (intent === "call") {
    await continueCallAfterService(chatId, messageId, chatKey, locale, nextData, slice);
    return;
  }
  await advanceBookingFlow(chatId, messageId, chatKey, locale, nextData, slice);
}

export async function handleServiceCategoryPick(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  intent: "book" | "call",
  categoryId: string,
  slice: ClientPortalSlice | null | undefined
): Promise<void> {
  const L = getClientBotLabels(locale);
  if (categoryId === "otherReason") {
    await promptCustomService(chatId, messageId, chatKey, locale, intent);
    return;
  }
  if (hasMultipleSubOptions(categoryId as Parameters<typeof hasMultipleSubOptions>[0], locale)) {
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      `${L.chooseSubService}\n<b>${getClientServiceLabel(categoryId, locale)}</b>`,
      clientServiceOptionsKeyboard(locale, intent, categoryId)
    );
    return;
  }
  const opts = getCategorySubOptions(
    categoryId as Parameters<typeof getCategorySubOptions>[0],
    locale
  );
  await continueWithServiceSelection(
    chatId,
    messageId,
    chatKey,
    locale,
    intent,
    categoryId,
    opts[0]?.id ?? "_default",
    slice
  );
}

export async function finalizeCustomService(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  data: Record<string, string>,
  slice: ClientPortalSlice | null | undefined
): Promise<void> {
  const intent = data.intent === "call" ? "call" : "book";
  const text = data.customServiceText?.trim() ?? "";
  const nextData = {
    intent,
    serviceId: "otherReason",
    serviceLabel: text,
    comment: text,
  };
  if (intent === "call") {
    await continueCallAfterService(chatId, messageId, chatKey, locale, nextData, slice);
    return;
  }
  await advanceBookingFlow(chatId, messageId, chatKey, locale, nextData, slice);
}

export async function promptComment(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  data: Record<string, string>
): Promise<void> {
  const L = getClientBotLabels(locale);
  await setClientTelegramSession(chatKey, { step: "client_comment", data });
  await replyOrEdit(chatId, messageId, locale, L.enterComment, clientSkipCommentKeyboard(locale));
}

export async function continueBookAfterTime(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  data: Record<string, string>,
  slice: ClientPortalSlice | null | undefined
): Promise<void> {
  const filled = linkedProfileData(slice, { ...data, intent: "book" });
  if (filled.name && filled.phone) {
    await showConfirm(chatId, messageId, chatKey, locale, filled);
    return;
  }
  await promptName(chatId, messageId, chatKey, locale, "book", filled);
}

export async function continueCallAfterService(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  data: Record<string, string>,
  slice: ClientPortalSlice | null | undefined
): Promise<void> {
  const filled = linkedProfileData(slice, { ...data, intent: "call" });
  if (filled.name && filled.phone) {
    if (filled.comment?.trim() || filled.customServiceText?.trim()) {
      await showConfirm(chatId, messageId, chatKey, locale, filled);
      return;
    }
    await promptComment(chatId, messageId, chatKey, locale, filled);
    return;
  }
  await promptName(chatId, messageId, chatKey, locale, "call", filled);
}

export async function advanceBookingFlow(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  draft: Record<string, string>,
  slice: ClientPortalSlice | null | undefined
): Promise<void> {
  const L = getClientBotLabels(locale);
  const data: Record<string, string> = { ...draft, intent: "book" };

  if (!data.serviceId) {
    await clearTelegramSessionKeepLocale(chatKey);
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      L.chooseCategory,
      clientServiceCategoryKeyboard(locale, "book")
    );
    return;
  }

  const filled = linkedProfileData(slice, data);

  if (filled.date && filled.time && filled.name && filled.phone) {
    await showConfirm(chatId, messageId, chatKey, locale, filled);
    return;
  }

  if (filled.date && filled.time) {
    await continueBookAfterTime(chatId, messageId, chatKey, locale, filled, slice);
    return;
  }

  if (filled.date) {
    await setClientTelegramSession(chatKey, { data: filled });
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      `${L.chooseTime}\n📅 ${formatDateShort(filled.date, locale)}`,
      clientTimeKeyboard(locale)
    );
    return;
  }

  await setClientTelegramSession(chatKey, { data: filled });
  await replyOrEdit(chatId, messageId, locale, L.chooseDate, clientDateKeyboard(locale));
}
