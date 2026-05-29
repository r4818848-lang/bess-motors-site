import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import {
  answerCallbackQuery,
  editTelegramMessage,
  removeReplyKeyboard,
  sendTelegramMessage,
} from "@/lib/server/telegram-api";
import { getTelegramSession } from "@/lib/server/telegram-sessions";
import {
  countPendingSign,
  countUnread,
  formatAppointmentsSlice,
  formatCarsSlice,
  formatLinkedWelcome,
  formatNotifications,
  formatWorkOrderDetail,
  formatWorkOrdersList,
} from "./client-cabinet-format";
import {
  createTelegramBooking,
  createTelegramCallRequest,
  isValidClientName,
  isValidClientPhone,
} from "./client-booking";
import {
  type BotLocale,
  getClientBotLabels,
  isBotLocale,
  isStartCommand,
  LANGUAGE_NAMES,
} from "./client-i18n";
import {
  clearTelegramSessionKeepLocale,
  getClientLocale,
  saveClientLocale,
  setClientTelegramSession,
} from "./client-locale";
import {
  clientConfirmBookingKeyboard,
  clientContactsKeyboard,
  clientDateKeyboard,
  clientLanguageKeyboard,
  clientMainKeyboard,
  clientMenuForUser,
  clientOrderDetailKeyboard,
  clientOrdersKeyboard,
  clientServiceKeyboard,
  clientSkipCommentKeyboard,
  clientStartReplyKeyboard,
  clientTimeKeyboard,
  vinAskPlateKeyboard,
  vinConfirmKeyboard,
  linkConfirmKeyboard,
  linkEditPickKeyboard,
  linkPlateStepKeyboard,
  formatLinkConfirmSummary,
  phoneRequestReplyKeyboard,
  clientBackMenuRow,
  clientAppointmentsKeyboard,
  clientAppointmentDetailKeyboard,
} from "./client-keyboards";
import {
  advanceBookingFlow,
  continueBookAfterTime,
  continueCallAfterService,
  linkedProfileData,
  promptComment,
  promptName,
  promptPhone,
  replyOrEdit,
  showConfirm,
} from "./client-booking-flow";
import {
  getClientPortalByChat,
  linkTelegramClient,
  type TelegramProfile,
} from "./client-telegram-link";
import { decodeTimeSlot, formatDateShort, getClientServiceLabel, normalizeTelegramServiceId, nextBookableDates } from "./client-services";
import { addVehicleByVinToLinkedClient, decodeVinForClient, formatVinPreview, normalizeVinInput } from "./client-vin";
import { formatPreVisitChecklistText } from "@/lib/pre-visit-checklist";
import {
  applyReferralFromStart,
  ensureReferralCode,
  formatRepairStatusLine,
  formatServiceHistory,
  handleAptStartParam,
  rebookLastAppointment,
  saveTelegramRating,
  sendGalleryPhotosLink,
  startRebookPlus7,
  telegramBotDeepLink,
  toggleQuietHours,
} from "./client-extras";
import { saveClientTelegramPhoto } from "./client-photo";
import { tryParseSmartBooking } from "./client-smart-booking";
import {
  finishSymptomQuiz,
  parseSelectedSymptoms,
  startSymptomQuiz,
  symptomQuizKeyboard,
  toggleSymptom,
} from "./client-symptom-quiz";
import { formatConciergeMessage } from "./client-concierge";
import {
  formatNotifyPrefsIntro,
  notifyPrefsKeyboard,
  toggleMuteWeek,
  toggleMute24h,
  toggleNotifyCategory,
} from "./client-notify-prefs";
import { sendShareAppointment } from "./client-share-apt";
import type { ClientPortalSlice } from "@/lib/client-sign";
import type { WizardSymptomId } from "@/lib/car-problem-wizard";
import { markAllNotificationsRead } from "@/lib/client-notifications";
import { resolveExtraWorkApproval } from "./extra-work-approval";
import { rescheduleAppointment } from "./client-apt-reschedule";
import {
  aptRescheduleKeyboard,
  formatWarrantyList,
  packagesKeyboard,
  sendLocation,
  sendPromoList,
  startPackageBooking,
  startRepeatOrder,
} from "./client-features-v3";
import {
  vehiclePickKeyboard,
  setActiveVehicle,
} from "./client-vehicle-pick";
import { mutateCrm } from "./crm-actions";
import {
  handleClientTextCommands,
  handleExtrasV4Callback,
  sendExtrasMenu,
} from "./client-features-v4";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramContact = {
  phone_number: string;
  user_id?: number;
  first_name?: string;
};

type TelegramPhotoSize = { file_id: string };

type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
  contact?: TelegramContact;
  photo?: TelegramPhotoSize[];
  from?: TelegramUser;
};

type TelegramCallback = {
  id: string;
  message?: TelegramMessage;
  data?: string;
};

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function profileFrom(msg: TelegramMessage): TelegramProfile {
  return {
    chatId: String(msg.chat.id),
    telegramUserId: msg.from?.id ?? msg.chat.id,
    username: msg.from?.username,
    firstName: msg.from?.first_name ?? msg.contact?.first_name,
    lastName: msg.from?.last_name,
  };
}

function parseStartParam(text: string): string | undefined {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return undefined;
  return parts.slice(1).join(" ");
}

async function promptLanguage(
  chatId: number,
  messageId?: number
): Promise<void> {
  const text = getClientBotLabels("en").chooseLanguage;
  const kb = clientLanguageKeyboard();
  if (messageId) {
    const ok = await editTelegramMessage(chatId, messageId, text, kb);
    if (!ok) await sendTelegramMessage(chatId, text, kb);
  } else {
    await sendTelegramMessage(chatId, text, kb);
  }
}

async function attachStartKeyboard(chatId: number, locale: BotLocale): Promise<void> {
  const L = getClientBotLabels(locale);
  await sendTelegramMessage(chatId, L.startKeyboardHint, clientStartReplyKeyboard(L));
}

async function onLocaleChosen(
  chatId: number,
  locale: BotLocale,
  messageId?: number,
  startParam?: string
): Promise<void> {
  const chatKey = String(chatId);
  await saveClientLocale(chatKey, locale);
  const L = getClientBotLabels(locale);
  const savedText = L.languageSaved(LANGUAGE_NAMES[locale]);
  if (messageId) {
    await editTelegramMessage(chatId, messageId, savedText);
  } else {
    await sendTelegramMessage(chatId, savedText);
  }
  await attachStartKeyboard(chatId, locale);
  await showClientMenu(chatId, undefined, locale, startParam);
  await handleStartDeepLinks(chatId, locale, startParam);
}

async function handleStartDeepLinks(
  chatId: number,
  locale: BotLocale,
  startParam?: string
): Promise<void> {
  if (!startParam) return;
  const chatKey = String(chatId);
  if (startParam.startsWith("ref_")) {
    await applyReferralFromStart(chatKey, startParam.slice(4));
    return;
  }
  if (startParam.startsWith("apt_")) {
    await handleAptStartParam(chatId, locale, startParam.slice(4));
    return;
  }
  if (startParam.startsWith("rebook_")) {
    await rebookLastAppointment(chatId, chatKey, locale, startParam.slice(7) || undefined);
  }
}

function clientUserMenu(
  locale: BotLocale,
  slice: ClientPortalSlice | null | undefined
): ReturnType<typeof clientMenuForUser> {
  if (slice) {
    return clientMenuForUser(locale, slice, countPendingSign(slice), countUnread(slice));
  }
  return clientMainKeyboard(locale);
}

async function markInboxRead(userId: string): Promise<void> {
  await mutateCrm((db) => {
    markAllNotificationsRead(db, userId);
  });
}

async function showClientMenu(
  chatId: number,
  messageId: number | undefined,
  locale: BotLocale,
  startParam?: string
): Promise<void> {
  const chatKey = String(chatId);
  await clearTelegramSessionKeepLocale(chatKey);
  const L = getClientBotLabels(locale);
  const slice = await getClientPortalByChat(chatKey);

  if (slice) {
    const pending = countPendingSign(slice);
    const unread = countUnread(slice);
    const text = `${formatLinkedWelcome(locale, slice.user.name)}\n\n${L.smartBookHint}`;
    const kb = clientMenuForUser(locale, slice, pending, unread);
    await replyOrEdit(chatId, messageId, locale, text, kb);

    if (startParam?.startsWith("sign_")) {
      const orderId = startParam.slice(5);
      const detail = formatWorkOrderDetail(locale, slice, orderId);
      if (detail) {
        const order = slice.workOrders.find((o) => o.id === orderId);
        const needsSign = order?.confirmationStatus !== "confirmed";
        await sendTelegramMessage(
          chatId,
          needsSign ? `${L.signIntro}\n\n${detail}` : detail,
          clientOrderDetailKeyboard(locale, orderId, needsSign)
        );
      }
    }
    return;
  }

  let text = `${L.welcome}\n\n${L.smartBookHint}`;
  if (startParam?.startsWith("sign_")) {
    text = `${L.signIntro}\n\n${L.welcome}\n\n${L.smartBookHint}`;
  }
  await replyOrEdit(chatId, messageId, locale, text, clientMainKeyboard(locale, false));
}

async function startLinkFlow(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  _profile: TelegramProfile,
  orderId?: string
): Promise<void> {
  const L = getClientBotLabels(locale);
  const data: Record<string, string> = orderId
    ? { orderId, linkIntent: "sign" }
    : { linkIntent: "cabinet" };
  await promptLinkPhone(chatId, chatKey, locale, data);
  if (messageId) {
    await editTelegramMessage(
      chatId,
      messageId,
      L.linkIntro,
      clientMainKeyboard(locale, false)
    );
  }
}

async function promptLinkPhone(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  sessionData: Record<string, string>
): Promise<void> {
  const L = getClientBotLabels(locale);
  await setClientTelegramSession(chatKey, {
    step: "client_link_phone",
    data: sessionData,
  });
  await sendTelegramMessage(chatId, L.linkIntro, phoneRequestReplyKeyboard(locale));
}

async function hideReplyKeyboard(chatId: number): Promise<void> {
  await sendTelegramMessage(chatId, "·", removeReplyKeyboard());
}

async function promptLinkPlate(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  sessionData: Record<string, string>
): Promise<void> {
  const L = getClientBotLabels(locale);
  const phone = esc(sessionData.phone ?? "");
  await setClientTelegramSession(chatKey, {
    step: "client_link_plate",
    data: sessionData,
  });
  await sendTelegramMessage(
    chatId,
    L.linkPhoneAccepted(phone),
    linkPlateStepKeyboard(locale)
  );
}

async function showLinkConfirm(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  sessionData: Record<string, string>
): Promise<void> {
  const phone = sessionData.phone ?? "";
  const plate = sessionData.plate ?? "";
  await setClientTelegramSession(chatKey, {
    step: "client_link_confirm",
    data: sessionData,
  });
  await sendTelegramMessage(
    chatId,
    formatLinkConfirmSummary(locale, esc(phone), esc(plate)),
    linkConfirmKeyboard(locale)
  );
}

async function handleContactShare(
  msg: TelegramMessage,
  locale: BotLocale
): Promise<void> {
  const chatId = msg.chat.id;
  const chatKey = String(chatId);
  const L = getClientBotLabels(locale);
  const contact = msg.contact;
  if (!contact) return;

  const session = await getTelegramSession(chatKey);
  if (session.step !== "client_link_phone") return;

  const fromId = msg.from?.id;
  if (contact.user_id && fromId && contact.user_id !== fromId) {
    await sendTelegramMessage(chatId, L.wrongContact, phoneRequestReplyKeyboard(locale));
    return;
  }

  const phone = normalizePhone(contact.phone_number);
  if (!phone) {
    await sendTelegramMessage(chatId, L.invalidPhone, phoneRequestReplyKeyboard(locale));
    return;
  }

  await hideReplyKeyboard(chatId);

  const nextData: Record<string, string> = {
    ...(session.data ?? {}),
    phone,
    telegramUserId: String(fromId ?? chatId),
    telegramUsername: msg.from?.username ?? "",
    firstName: msg.from?.first_name ?? "",
    lastName: msg.from?.last_name ?? "",
  };
  await promptLinkPlate(chatId, chatKey, locale, nextData);
}

async function completeLink(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  plate: string,
  sessionData: Record<string, string>
): Promise<void> {
  const L = getClientBotLabels(locale);
  const phone = sessionData.phone;
  if (!phone) {
    await sendTelegramMessage(chatId, L.invalidPhone, clientMainKeyboard(locale));
    return;
  }

  const profile: TelegramProfile = {
    chatId: String(chatId),
    telegramUserId: Number(sessionData.telegramUserId ?? chatId),
    username: sessionData.telegramUsername || undefined,
    firstName: sessionData.firstName || undefined,
    lastName: sessionData.lastName || undefined,
  };

  const result = await linkTelegramClient({
    profile,
    phone,
    plate,
    name: sessionData.name,
    orderId: sessionData.orderId,
    locale,
  });

  await clearTelegramSessionKeepLocale(chatKey);

  if (!result.ok) {
    await sendTelegramMessage(chatId, L.saveFailed, clientMainKeyboard(locale));
    return;
  }

  const slice = await getClientPortalByChat(String(chatId));
  const kb = clientUserMenu(locale, slice);

  await sendTelegramMessage(chatId, L.linkSuccess, kb);

  if (sessionData.orderId && slice) {
    const detail = formatWorkOrderDetail(locale, slice, sessionData.orderId);
    if (detail) {
      const order = slice.workOrders.find((o) => o.id === sessionData.orderId);
      const needsSign = order?.confirmationStatus !== "confirmed";
      await sendTelegramMessage(
        chatId,
        detail,
        clientOrderDetailKeyboard(locale, sessionData.orderId, needsSign)
      );
    }
  }
}

export async function handleClientMessage(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  const chatKey = String(chatId);
  const text = msg.text?.trim() ?? "";

  if (text.startsWith("/start") || text === "/menu" || isStartCommand(text)) {
    const locale = await getClientLocale(chatKey);
    if (!locale) {
      await promptLanguage(chatId);
      return;
    }
    const startParam = parseStartParam(text);
    await showClientMenu(chatId, undefined, locale, startParam);
    await handleStartDeepLinks(chatId, locale, startParam);
    return;
  }

  if (text === "/language") {
    await promptLanguage(chatId);
    return;
  }

  let locale = await getClientLocale(chatKey);
  if (!locale) {
    if (msg.contact) {
      await promptLanguage(chatId);
      return;
    }
    await promptLanguage(chatId);
    return;
  }

  const L = getClientBotLabels(locale);

  if (text.startsWith("/")) {
    const handled = await handleClientTextCommands(chatId, chatKey, locale, text);
    if (handled) return;
  }

  if (msg.contact) {
    await handleContactShare(msg, locale);
    return;
  }

  if (msg.photo?.length) {
    const session = await getTelegramSession(chatKey);
    if (session.step !== "client_photo_upload") {
      const hint =
        locale === "pl"
          ? "📷 Aby wysłać zdjęcie do zlecenia — użyj «Wyślij zdjęcie» w menu."
          : locale === "en"
            ? "📷 To attach a photo to your order — use «Send photo» in the menu."
            : "📷 Чтобы прикрепить фото к заказу — нажмите «Отправить фото» в меню.";
      await sendTelegramMessage(chatId, hint, clientUserMenu(locale, await getClientPortalByChat(chatKey)));
      return;
    }
    const fileId = msg.photo[msg.photo.length - 1]!.file_id;
    const res = await saveClientTelegramPhoto({
      chatKey,
      fileId,
      orderId: session.data?.orderId,
    });
    await clearTelegramSessionKeepLocale(chatKey);
    const sliceAfter = await getClientPortalByChat(chatKey);
    const kb = clientUserMenu(locale, sliceAfter);
    await sendTelegramMessage(
      chatId,
      res.ok && res.orderNumber ? L.photoSaved(res.orderNumber) : L.photoFailed,
      kb
    );
    return;
  }

  const session = await getTelegramSession(chatKey);

  if (session.step === "client_symptom") {
    const selected = parseSelectedSymptoms(session.data ?? {});
    const hint =
      locale === "pl"
        ? "👆 Wybierz objawy przyciskami powyżej."
        : locale === "en"
          ? "👆 Pick symptoms using the buttons above."
          : "👆 Выберите симптомы кнопками выше.";
    await sendTelegramMessage(chatId, hint, symptomQuizKeyboard(locale, selected));
    return;
  }

  if (session.step === "client_vin_input") {
    const vin = normalizeVinInput(text);
    if (vin.length !== 17) {
      await sendTelegramMessage(chatId, L.vinInvalid);
      return;
    }
    const decoded = await decodeVinForClient(vin);
    if (!decoded.ok || !decoded.found || !decoded.vehicle) {
      await sendTelegramMessage(chatId, L.vinNotFound);
      return;
    }
    await setClientTelegramSession(chatKey, {
      step: "client_vin_plate",
      data: {
        vin,
        plate: "",
        ...Object.fromEntries(
          Object.entries(decoded.vehicle).map(([k, v]) => [k, String(v ?? "")])
        ),
      },
    });
    await sendTelegramMessage(
      chatId,
      `${formatVinPreview(decoded.vehicle)}\n\n${L.vinPlateAsk}`,
      vinAskPlateKeyboard(locale)
    );
    return;
  }

  if (session.step === "client_vin_plate") {
    const plate = text.trim().toUpperCase();
    const vin = session.data?.vin ?? "";
    if (!vin) {
      await showClientMenu(chatId, undefined, locale);
      return;
    }
    const next = { ...(session.data ?? {}), plate };
    await setClientTelegramSession(chatKey, { step: "client_vin_confirm", data: next });
    const preview = formatVinPreview({ ...next, vin });
    await sendTelegramMessage(
      chatId,
      `${preview}\n\n${L.vinConfirmTitle}`,
      vinConfirmKeyboard(locale)
    );
    return;
  }

  if (session.step === "client_link_phone") {
    if (!isValidClientPhone(text)) {
      await sendTelegramMessage(chatId, L.invalidPhone, phoneRequestReplyKeyboard(locale));
      return;
    }
    const nextData: Record<string, string> = {
      ...(session.data ?? {}),
      phone: normalizePhone(text),
      telegramUserId: String(msg.from?.id ?? chatId),
      telegramUsername: msg.from?.username ?? "",
      firstName: msg.from?.first_name ?? "",
      lastName: msg.from?.last_name ?? "",
    };
    await hideReplyKeyboard(chatId);
    await promptLinkPlate(chatId, chatKey, locale, nextData);
    return;
  }

  if (session.step === "client_link_plate") {
    const plateKey = normalizePlateKey(text);
    if (plateKey.length < 2) {
      await sendTelegramMessage(chatId, L.invalidPlate, linkPlateStepKeyboard(locale));
      return;
    }
    if (!session.data?.phone) {
      await promptLinkPhone(chatId, chatKey, locale, session.data ?? {});
      return;
    }
    const nextData = { ...session.data, plate: text.trim().toUpperCase() };
    await showLinkConfirm(chatId, chatKey, locale, nextData);
    return;
  }

  if (session.step === "client_link_confirm") {
    await sendTelegramMessage(chatId, L.linkConfirmHint, linkConfirmKeyboard(locale));
    return;
  }

  if (session.step === "client_name") {
    if (!isValidClientName(text)) {
      await sendTelegramMessage(chatId, L.invalidName, {
        inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]],
      });
      return;
    }
    const data: Record<string, string> = { ...(session.data ?? {}), name: text.trim() };
    const slice = await getClientPortalByChat(chatKey);
    if (slice?.user.phone) {
      data.phone = slice.user.phone;
      const intent = data.intent === "call" ? "call" : "book";
      if (intent === "call") await promptComment(chatId, undefined, chatKey, locale, data);
      else await showConfirm(chatId, undefined, chatKey, locale, data);
      return;
    }
    await promptPhone(chatId, undefined, chatKey, locale, data);
    return;
  }

  if (session.step === "client_phone") {
    if (!isValidClientPhone(text)) {
      await sendTelegramMessage(chatId, L.invalidPhone, {
        inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]],
      });
      return;
    }
    const data: Record<string, string> = {
      ...(session.data ?? {}),
      phone: normalizePhone(text),
    };
    if (data.intent === "call") await promptComment(chatId, undefined, chatKey, locale, data);
    else await showConfirm(chatId, undefined, chatKey, locale, data);
    return;
  }

  if (session.step === "client_comment") {
    const data = { ...(session.data ?? {}), comment: text.trim() };
    await showConfirm(chatId, undefined, chatKey, locale, data);
    return;
  }

  if (!session.step && text.length >= 8) {
    const parsed = tryParseSmartBooking(text);
    if (parsed) {
      const nextData: Record<string, string> = {
        intent: "book",
        serviceId: parsed.serviceId,
        serviceLabel: getClientServiceLabel(parsed.serviceId, locale),
        date: parsed.date,
        time: parsed.time,
        comment: parsed.comment ?? text.trim(),
      };
      const slice = await getClientPortalByChat(chatKey);
      const filled = linkedProfileData(slice, nextData);
      if (filled.name && filled.phone) {
        await showConfirm(chatId, undefined, chatKey, locale, filled);
        return;
      }
      if (filled.name) {
        await promptPhone(chatId, undefined, chatKey, locale, filled);
        return;
      }
      await setClientTelegramSession(chatKey, { step: "client_name", data: filled });
      await sendTelegramMessage(
        chatId,
        [
          locale === "pl"
            ? "📝 <b>Rozpoznano zapisy:</b>"
            : locale === "en"
              ? "📝 <b>Booking draft:</b>"
              : "📝 <b>Распознана запись:</b>",
          "",
          `📅 ${formatDateShort(parsed.date, locale)} · ${parsed.time}`,
          `🔧 ${nextData.serviceLabel}`,
          "",
          L.enterName,
        ].join("\n"),
        { inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]] }
      );
      return;
    }
  }

  const pendingSession = await getTelegramSession(chatKey);
  if (!pendingSession.step && pendingSession.data?.serviceId && pendingSession.data?.intent) {
    const hint =
      locale === "pl"
        ? "👆 Potwierdź wizytę przyciskiem powyżej lub wpisz /menu, aby anulować."
        : locale === "en"
          ? "👆 Confirm with the button above or type /menu to cancel."
          : "👆 Подтвердите кнопкой выше или /menu для отмены.";
    await sendTelegramMessage(chatId, hint);
    return;
  }

  if (text.startsWith("/")) {
    await showClientMenu(chatId, undefined, locale);
  }
}

export async function handleClientCallback(cb: TelegramCallback): Promise<void> {
  const chatId = cb.message?.chat.id;
  const messageId = cb.message?.message_id;
  const data = cb.data ?? "";

  if (!chatId) {
    await answerCallbackQuery(cb.id);
    return;
  }

  if (data === "noop") {
    await answerCallbackQuery(cb.id);
    return;
  }

  await answerCallbackQuery(cb.id);

  const chatKey = String(chatId);

  if (data === "cl:lang:pick") {
    await promptLanguage(chatId, messageId);
    return;
  }

  if (data.startsWith("cl:lang:") && data !== "cl:lang:pick") {
    const code = data.slice(8);
    if (isBotLocale(code)) {
      await onLocaleChosen(chatId, code, messageId);
    }
    return;
  }

  const locale = await getClientLocale(chatKey);
  if (!locale) {
    await promptLanguage(chatId, messageId);
    return;
  }

  if (data === "cl:more" || data.startsWith("cl:v4:")) {
    if (data === "cl:more") {
      await sendExtrasMenu(chatId, locale, chatKey, messageId);
      return;
    }
    const handled = await handleExtrasV4Callback(chatId, chatKey, locale, data, messageId);
    if (handled) return;
  }

  const L = getClientBotLabels(locale);
  const session = await getTelegramSession(chatKey);
  const sessionData = session.data ?? {};
  const slice = await getClientPortalByChat(chatKey);
  const profile = cb.message
    ? profileFrom(cb.message)
    : {
        chatId: chatKey,
        telegramUserId: chatId,
      };

  if (data === "cl:menu") {
    await showClientMenu(chatId, messageId, locale);
    return;
  }

  if (data === "cl:sym:start") {
    await startSymptomQuiz(chatId, chatKey, locale);
    return;
  }

  if (data === "cl:sym:done") {
    await finishSymptomQuiz(chatId, chatKey, locale);
    return;
  }

  if (data.startsWith("cl:sym:")) {
    const sid = data.slice(7) as WizardSymptomId;
    await toggleSymptom(chatId, chatKey, locale, sid, messageId);
    return;
  }

  if (data === "cl:pkg:menu") {
    await replyOrEdit(chatId, messageId, locale, L.packagesBtn, packagesKeyboard(locale));
    return;
  }

  if (data.startsWith("cl:pkg:") && data !== "cl:pkg:menu") {
    await startPackageBooking(chatId, chatKey, locale, data.slice(7));
    return;
  }

  if (data === "cl:rebook7") {
    await startRebookPlus7(chatId, chatKey, locale);
    return;
  }

  if (data === "cl:promo") {
    await sendPromoList(chatId, locale);
    return;
  }

  if (data === "cl:location") {
    await sendLocation(chatId, locale);
    return;
  }

  if (data === "cl:photos") {
    await sendGalleryPhotosLink(chatId, locale);
    return;
  }

  if (data === "cl:concierge") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const text = await formatConciergeMessage(locale, chatKey);
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      text ?? L.signIntro,
      clientUserMenu(locale, slice)
    );
    return;
  }

  if (data === "cl:quiet") {
    const on = await toggleQuietHours(chatKey);
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      on ? L.quietHoursOn : L.quietHoursOff,
      clientUserMenu(locale, slice)
    );
    return;
  }

  if (data === "cl:veh:pick") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const kb = vehiclePickKeyboard(locale, slice);
    if (kb) {
      await replyOrEdit(chatId, messageId, locale, L.vehiclePick, kb);
    } else {
      const msg =
        locale === "pl"
          ? "🚗 Masz jedno auto w profilu."
          : locale === "en"
            ? "🚗 You have one vehicle on file."
            : "🚗 В профиле одно авто.";
      await replyOrEdit(chatId, messageId, locale, msg, clientUserMenu(locale, slice));
    }
    return;
  }

  if (data.startsWith("cl:veh:") && data !== "cl:veh:pick") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const vehicleId = data.slice(7);
    if (!slice.vehicles.some((v) => v.id === vehicleId)) {
      await replyOrEdit(chatId, messageId, locale, L.saveFailed, clientUserMenu(locale, slice));
      return;
    }
    const ok = await setActiveVehicle(chatKey, vehicleId);
    const vehicle = slice.vehicles.find((v) => v.id === vehicleId);
    const msg = ok && vehicle
      ? `✅ ${vehicle.plate} · ${vehicle.make} ${vehicle.model}`
      : L.saveFailed;
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      msg,
      clientUserMenu(locale, slice)
    );
    return;
  }

  if (data === "cl:book:draft") {
    await advanceBookingFlow(chatId, messageId, chatKey, locale, sessionData, slice);
    return;
  }

  if (data === "cl:status") {
    const line = await formatRepairStatusLine(locale, chatKey);
    if (line) {
      await replyOrEdit(chatId, messageId, locale, line, clientUserMenu(locale, slice));
      return;
    }
    await replyOrEdit(chatId, messageId, locale, L.signIntro, {
      inline_keyboard: [
        [{ text: L.activate, callback_data: "cl:link" }],
        clientBackMenuRow(locale),
      ],
    });
    return;
  }

  if (data === "cl:history") {
    const text = await formatServiceHistory(locale, chatKey);
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      text ?? L.signIntro,
      clientUserMenu(locale, slice)
    );
    return;
  }

  if (data === "cl:photo") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const active = [...slice.workOrders]
      .filter((o) => o.status !== "delivered")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (!active) {
      const msg =
        locale === "pl"
          ? "📷 Brak aktywnego zlecenia — nie można dodać zdjęcia."
          : locale === "en"
            ? "📷 No active work order to attach a photo."
            : "📷 Нет активного заказ-наряда для фото.";
      await replyOrEdit(chatId, messageId, locale, msg, clientUserMenu(locale, slice));
      return;
    }
    await setClientTelegramSession(chatKey, {
      step: "client_photo_upload",
      data: { orderId: active.id },
    });
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      locale === "pl"
        ? "📷 Wyślij zdjęcie — zapiszemy do aktywnego zlecenia."
        : locale === "en"
          ? "📷 Send a photo — we will attach it to your work order."
          : "📷 Отправьте фото — прикрепим к заказ-наряду.",
      clientUserMenu(locale, slice)
    );
    return;
  }

  if (data === "cl:warranty") {
    const text = await formatWarrantyList(locale, chatKey);
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      text ?? L.signIntro,
      clientUserMenu(locale, slice)
    );
    return;
  }

  if (data.startsWith("cl:apt:view:")) {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const aptId = data.slice(12);
    const apt = slice.appointments.find((a) => a.id === aptId);
    if (!apt) {
      await replyOrEdit(chatId, messageId, locale, L.noAppointments, clientUserMenu(locale, slice));
      return;
    }
    const services = apt.serviceIds.map((id) => getClientServiceLabel(id, locale)).join(", ");
    const text = [
      `📅 <b>${apt.date} · ${apt.time}</b>`,
      `🔧 ${services}`,
      `📌 ${L.appointmentStatus[apt.appointmentStatus] ?? apt.appointmentStatus}`,
    ].join("\n");
    await replyOrEdit(chatId, messageId, locale, text, clientAppointmentDetailKeyboard(locale, aptId));
    return;
  }

  if (data === "cl:rebook") {
    await rebookLastAppointment(chatId, chatKey, locale);
    return;
  }

  if (data.startsWith("cl:rebook:go:")) {
    const serviceId = data.slice(13);
    await clearTelegramSessionKeepLocale(chatKey);
    await advanceBookingFlow(
      chatId,
      messageId,
      chatKey,
      locale,
      {
        intent: "book",
        serviceId,
        serviceLabel: getClientServiceLabel(serviceId, locale),
      },
      slice
    );
    return;
  }

  if (data === "cl:referral") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const code = ensureReferralCode(slice.user);
    const link = telegramBotDeepLink(`ref_${code}`);
    let text = L.referralText(link);
    const { loadCrmFromCloud } = await import("./crm-actions");
    const cloudDb = await loadCrmFromCloud();
    if (cloudDb) {
      const { formatReferralTelegramMessage } = await import("@/lib/server/referral-telegram-notify");
      text = formatReferralTelegramMessage(cloudDb, slice.user, locale, link);
    }
    await replyOrEdit(chatId, messageId, locale, text, {
      inline_keyboard: [[{ text: "📤 Share", url: `https://t.me/share/url?url=${encodeURIComponent(link)}` }], clientBackMenuRow(locale)],
    });
    return;
  }

  if (data === "cl:notify") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    await replyOrEdit(chatId, messageId, locale, formatNotifyPrefsIntro(locale), notifyPrefsKeyboard(locale, slice.user));
    return;
  }

  if (data.startsWith("cl:np:")) {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const key = data.slice(6);
    if (key === "mute24") {
      const muted = await toggleMute24h(chatKey);
      const fresh = await getClientPortalByChat(chatKey);
      if (fresh) {
        await replyOrEdit(
          chatId,
          messageId,
          locale,
          formatNotifyPrefsIntro(locale),
          notifyPrefsKeyboard(locale, fresh.user)
        );
      }
      return;
    }
    if (key === "mute7") {
      const muted = await toggleMuteWeek(chatKey);
      const fresh = await getClientPortalByChat(chatKey);
      if (fresh) {
        await replyOrEdit(
          chatId,
          messageId,
          locale,
          formatNotifyPrefsIntro(locale),
          notifyPrefsKeyboard(locale, fresh.user)
        );
      }
      return;
    }
    if (key === "booking" || key === "status" || key === "promo") {
      await toggleNotifyCategory(chatKey, key);
      const fresh = await getClientPortalByChat(chatKey);
      if (fresh) {
        await replyOrEdit(chatId, messageId, locale, formatNotifyPrefsIntro(locale), notifyPrefsKeyboard(locale, fresh.user));
      }
    }
    return;
  }

  if (data.startsWith("cl:share:apt:")) {
    const aptId = data.slice(13);
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const apt = slice.appointments.find((a) => a.id === aptId && a.userId === slice.user.id);
    if (!apt) {
      await sendTelegramMessage(chatId, L.noAppointments);
      return;
    }
    await sendShareAppointment(chatId, locale, apt);
    return;
  }

  if (data.startsWith("cl:apt:+1:") || data.startsWith("cl:apt:+7:")) {
    const days = data.includes("+7:") ? 7 : 1;
    const aptId = data.split(":").pop()!;
    if (!slice?.appointments.some((a) => a.id === aptId && a.userId === slice.user.id)) {
      await sendTelegramMessage(chatId, L.saveFailed);
      return;
    }
    const res = await rescheduleAppointment(aptId, days, slice.user.id);
    if (!res.ok) {
      await sendTelegramMessage(chatId, L.saveFailed);
      return;
    }
    const msg =
      locale === "pl"
        ? `✅ Przeniesiono o ${days} dni: ${res.apt?.date} ${res.apt?.time}`
        : locale === "en"
          ? `✅ Moved by ${days} days: ${res.apt?.date} ${res.apt?.time}`
          : `✅ Перенесено на ${days} дн.: ${res.apt?.date} ${res.apt?.time}`;
    const fresh = await getClientPortalByChat(chatKey);
    if (fresh) {
      await replyOrEdit(
        chatId,
        messageId,
        locale,
        `${msg}\n\n${formatAppointmentsSlice(locale, fresh)}`,
        clientAppointmentsKeyboard(locale, fresh)
      );
    } else {
      await sendTelegramMessage(chatId, msg);
    }
    return;
  }

  if (data.startsWith("cl:apt:shift:")) {
    const aptId = data.slice(13);
    if (!slice?.appointments.some((a) => a.id === aptId && a.userId === slice.user.id)) {
      await sendTelegramMessage(chatId, L.saveFailed);
      return;
    }
    await sendTelegramMessage(chatId, L.chooseDate, aptRescheduleKeyboard(locale, aptId));
    return;
  }

  if (data.startsWith("cl:extra:ok:") || data.startsWith("cl:extra:no:")) {
    const orderId = data.replace(/^cl:extra:(ok|no):/, "");
    const order = slice?.workOrders.find((o) => o.id === orderId);
    if (!slice || !order || order.userId !== slice.user.id) {
      await sendTelegramMessage(chatId, L.saveFailed);
      return;
    }
    const ok = data.startsWith("cl:extra:ok:");
    await resolveExtraWorkApproval(orderId, ok);
    await sendTelegramMessage(chatId, ok ? L.saved : L.cancel, clientUserMenu(locale, slice));
    return;
  }

  if (data.startsWith("cl:repeat:")) {
    const orderId = data.slice(10);
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const order = slice.workOrders.find((o) => o.id === orderId && o.userId === slice.user.id);
    if (order) {
      await startRepeatOrder(chatId, chatKey, locale, order);
    } else {
      await replyOrEdit(chatId, messageId, locale, L.orderNotFound, clientUserMenu(locale, slice));
    }
    return;
  }

  if (data.startsWith("cl:fu:issue:")) {
    const orderId = data.slice(12);
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const order = slice.workOrders.find((o) => o.id === orderId && o.userId === slice.user.id);
    if (!order) {
      await sendTelegramMessage(chatId, L.saveFailed);
      return;
    }
    if (slice.user.phone) {
      void mutateCrm((db) => {
        const row = db.workOrders.find(
          (o) => o.id === orderId && o.userId === slice.user.id
        );
        if (row) {
          const stamp = new Date().toISOString().slice(0, 10);
          const note = `[Telegram ${stamp}] Post-service: ISSUE`;
          row.clientNotes = row.clientNotes ? `${row.clientNotes}\n${note}` : note;
        }
      });
      await createTelegramCallRequest({
        serviceId: "diagnostic",
        clientName: slice.user.name,
        clientPhone: slice.user.phone,
        comment: `[URGENT post-service] ${order.number}`,
        telegramProfile: profile,
        locale,
      });
      await sendTelegramMessage(
        chatId,
        locale === "pl"
          ? "📞 Prośba o kontakt wysłana — oddzwonimy."
          : locale === "en"
            ? "📞 Call request sent — we will call you back."
            : "📞 Заявка на звонок отправлена — перезвоним."
      );
    } else {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
    }
    return;
  }

  if (data.startsWith("cl:fu:ok:")) {
    const orderId = data.split(":")[4];
    if (
      orderId &&
      slice &&
      !slice.workOrders.some((o) => o.id === orderId && o.userId === slice.user.id)
    ) {
      await sendTelegramMessage(chatId, L.saveFailed);
      return;
    }
    if (orderId && slice) {
      void mutateCrm((db) => {
        const order = db.workOrders.find(
          (o) => o.id === orderId && o.userId === slice.user.id
        );
        if (!order) return false;
        const stamp = new Date().toISOString().slice(0, 10);
        const note = `[Telegram ${stamp}] Post-service: OK`;
        order.clientNotes = order.clientNotes ? `${order.clientNotes}\n${note}` : note;
      });
    }
    const thanks =
      locale === "pl"
        ? "✅ Dziękujemy! Jeśli coś się zmieni — napisz lub zamów telefon."
        : locale === "en"
          ? "✅ Thanks! If anything changes — message us or request a call."
          : "✅ Спасибо! Если что-то изменится — напишите или закажите звонок.";
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      thanks,
      clientUserMenu(locale, slice)
    );
    return;
  }

  if (data.startsWith("cl:rate:")) {
    const parts = data.split(":");
    const orderId = parts[2];
    const stars = Number(parts[3]);
    if (orderId && stars >= 1 && stars <= 5 && slice?.workOrders.some((o) => o.id === orderId && o.userId === slice.user.id)) {
      await saveTelegramRating({ chatKey, orderId, stars });
      const thanks =
        locale === "pl"
          ? "✅ Dziękujemy za opinię!"
          : locale === "en"
            ? "✅ Thank you for your feedback!"
            : "✅ Спасибо за оценку!";
      await replyOrEdit(
        chatId,
        messageId,
        locale,
        thanks,
        clientUserMenu(locale, slice)
      );
    }
    return;
  }

  if (data === "cl:vin") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    await clearTelegramSessionKeepLocale(chatKey);
    await setClientTelegramSession(chatKey, { step: "client_vin_input", data: {} });
    await replyOrEdit(chatId, messageId, locale, L.vinEnter, {
      inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]],
    });
    return;
  }

  if (data === "cl:vin:plate:skip") {
    const d = session.data ?? sessionData;
    const vin = d.vin ?? "";
    if (!vin) {
      await showClientMenu(chatId, messageId, locale);
      return;
    }
    const next = { ...d, plate: "" };
    await setClientTelegramSession(chatKey, { step: "client_vin_confirm", data: next });
    const decoded = await decodeVinForClient(vin);
    const preview =
      decoded.found && decoded.vehicle
        ? formatVinPreview(decoded.vehicle)
        : `VIN: <code>${vin}</code>`;
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      `${preview}\n\n${L.vinConfirmTitle}`,
      vinConfirmKeyboard(locale)
    );
    return;
  }

  if (data === "cl:vin:edit:plate") {
    const d = session.data ?? sessionData;
    if (!d.vin) {
      await showClientMenu(chatId, messageId, locale);
      return;
    }
    await setClientTelegramSession(chatKey, { step: "client_vin_plate", data: d });
    await replyOrEdit(chatId, messageId, locale, L.vinPlateAsk, vinAskPlateKeyboard(locale));
    return;
  }

  if (data === "cl:vin:edit:vin") {
    await clearTelegramSessionKeepLocale(chatKey);
    await setClientTelegramSession(chatKey, { step: "client_vin_input", data: {} });
    await replyOrEdit(chatId, messageId, locale, L.vinEnter, {
      inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]],
    });
    return;
  }

  if (data === "cl:vin:add") {
    const d = session.data ?? sessionData;
    const vin = d.vin ?? "";
    if (!vin) {
      await showClientMenu(chatId, messageId, locale);
      return;
    }
    const plate = (d.plate ?? "").trim();
    const res = await addVehicleByVinToLinkedClient({ chatId: chatKey, vin, plate });
    await clearTelegramSessionKeepLocale(chatKey);
    if (!res.ok) {
      const msg =
        res.error === "duplicate"
          ? L.vinDuplicate
          : res.error === "not_linked"
            ? L.signIntro
            : L.vinNotFound;
      await replyOrEdit(
        chatId,
        messageId,
        locale,
        msg,
        clientUserMenu(locale, slice)
      );
      return;
    }
    const fresh = await getClientPortalByChat(chatKey);
    const kb = clientUserMenu(locale, fresh);
    await replyOrEdit(chatId, messageId, locale, L.vinAdded, kb);
    return;
  }

  if (data === "cl:link") {
    await startLinkFlow(chatId, messageId, chatKey, locale, profile, sessionData.orderId);
    return;
  }

  if (data === "cl:lk:ok") {
    const d = session.data ?? sessionData;
    if (!d.phone || !d.plate) {
      await showClientMenu(chatId, messageId, locale);
      return;
    }
    await completeLink(chatId, chatKey, locale, d.plate, d);
    return;
  }

  if (data === "cl:lk:no") {
    await replyOrEdit(chatId, messageId, locale, L.linkWhatToFix, linkEditPickKeyboard(locale));
    return;
  }

  if (data === "cl:lk:edit:phone") {
    const keep = { ...(session.data ?? sessionData) };
    delete keep.phone;
    delete keep.plate;
    await promptLinkPhone(chatId, chatKey, locale, keep);
    return;
  }

  if (data === "cl:lk:edit:plate") {
    const d = session.data ?? sessionData;
    if (!d.phone) {
      await promptLinkPhone(chatId, chatKey, locale, d);
      return;
    }
    const keep = { ...d };
    delete keep.plate;
    await promptLinkPlate(chatId, chatKey, locale, keep);
    return;
  }

  if (data === "cl:lk:restart") {
    await startLinkFlow(chatId, messageId, chatKey, locale, profile, sessionData.orderId);
    return;
  }

  if (data === "cl:contacts") {
    await replyOrEdit(chatId, messageId, locale, L.contactsText, clientContactsKeyboard(locale));
    return;
  }

  if (data.startsWith("cl:orders:")) {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const page = Number(data.slice(10)) || 0;
    const { text, totalPages } = formatWorkOrdersList(locale, slice, page);
    const orders = [...slice.workOrders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(page * 4, page * 4 + 4)
      .map((o) => ({
        id: o.id,
        number: o.number,
        needsSign: o.confirmationStatus !== "confirmed",
      }));
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      text,
      clientOrdersKeyboard(locale, orders, page, totalPages)
    );
    return;
  }

  if (data.startsWith("cl:wo:")) {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const orderId = data.slice(6);
    const detail = formatWorkOrderDetail(locale, slice, orderId);
    if (!detail) {
      await replyOrEdit(
        chatId,
        messageId,
        locale,
        L.orderNotFound,
        clientUserMenu(locale, slice)
      );
      return;
    }
    const order = slice.workOrders.find((o) => o.id === orderId);
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      detail,
      clientOrderDetailKeyboard(locale, orderId, order?.confirmationStatus !== "confirmed")
    );
    return;
  }

  if (data === "cl:notif") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    await markInboxRead(slice.user.id);
    const fresh = await getClientPortalByChat(chatKey);
    const view = fresh ?? slice;
    await replyOrEdit(chatId, messageId, locale, formatNotifications(locale, view), {
      inline_keyboard: [clientBackMenuRow(locale)],
    });
    return;
  }

  if (data === "cl:apts") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    await replyOrEdit(chatId, messageId, locale, formatAppointmentsSlice(locale, slice), clientAppointmentsKeyboard(locale, slice));
    return;
  }

  if (data === "cl:cars") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, locale, profile);
      return;
    }
    const inlineRows: InlineKeyboardMarkup["inline_keyboard"] = [
      [{ text: L.addVin, callback_data: "cl:vin" }],
    ];
    if (vehiclePickKeyboard(locale, slice)) {
      inlineRows.unshift([{ text: L.vehiclePick, callback_data: "cl:veh:pick" }]);
    }
    inlineRows.push(clientBackMenuRow(locale));
    await replyOrEdit(chatId, messageId, locale, formatCarsSlice(locale, slice), {
      inline_keyboard: inlineRows,
    });
    return;
  }

  if (data === "cl:book") {
    if (sessionData.serviceId && sessionData.intent === "book") {
      await advanceBookingFlow(chatId, messageId, chatKey, locale, sessionData, slice);
      return;
    }
    await clearTelegramSessionKeepLocale(chatKey);
    await replyOrEdit(chatId, messageId, locale, L.chooseService, clientServiceKeyboard(locale, "book"));
    return;
  }

  if (data === "cl:call") {
    await clearTelegramSessionKeepLocale(chatKey);
    await replyOrEdit(chatId, messageId, locale, L.chooseService, clientServiceKeyboard(locale, "call"));
    return;
  }

  if (data.startsWith("cl:svc:")) {
    const rest = data.slice(7);
    const colon = rest.indexOf(":");
    const intent = rest.slice(0, colon) as "book" | "call";
    const serviceId = normalizeTelegramServiceId(rest.slice(colon + 1));
    const nextData = {
      intent,
      serviceId,
      serviceLabel: getClientServiceLabel(serviceId, locale),
    };
    if (intent === "call") {
      await continueCallAfterService(chatId, messageId, chatKey, locale, nextData, slice);
      return;
    }
    await advanceBookingFlow(chatId, messageId, chatKey, locale, nextData, slice);
    return;
  }

  if (data.startsWith("cl:dt:")) {
    const date = data.slice(6);
    const bookable = nextBookableDates(21);
    if (!bookable.includes(date)) {
      await sendTelegramMessage(chatId, L.saveFailed);
      return;
    }
    const fresh = await getTelegramSession(chatKey);
    const nextData = { ...(fresh.data ?? sessionData), date };
    await setClientTelegramSession(chatKey, { data: nextData });
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      `${L.chooseTime}\n📅 ${formatDateShort(date, locale)}`,
      clientTimeKeyboard(locale)
    );
    return;
  }

  if (data.startsWith("cl:tm:")) {
    const time = decodeTimeSlot(data.slice(6));
    const fresh = await getTelegramSession(chatKey);
    await continueBookAfterTime(
      chatId,
      messageId,
      chatKey,
      locale,
      { ...(fresh.data ?? sessionData), time },
      slice
    );
    return;
  }

  if (data === "cl:skip") {
    const fresh = await getTelegramSession(chatKey);
    await showConfirm(chatId, messageId, chatKey, locale, fresh.data ?? sessionData);
    return;
  }

  if (data === "cl:cf:book") {
    const freshSession = await getTelegramSession(chatKey);
    const d = freshSession.data ?? sessionData;
    if (!d.serviceId || !d.date || !d.time || !d.name || !d.phone) {
      await advanceBookingFlow(chatId, messageId, chatKey, locale, d, slice);
      return;
    }
    const serviceId = normalizeTelegramServiceId(d.serviceId);
    const result = await createTelegramBooking({
      serviceId,
      date: d.date,
      time: decodeTimeSlot(d.time),
      clientName: d.name,
      clientPhone: d.phone,
      comment: d.comment,
      telegramProfile: profile,
      locale,
    });
    await clearTelegramSessionKeepLocale(chatKey);
    const freshSlice = await getClientPortalByChat(chatKey);
    if (result.ok) {
      const checklist = serviceId
        ? formatPreVisitChecklistText(serviceId, locale)
        : "";
      await replyOrEdit(
        chatId,
        messageId,
        locale,
        `${L.saved}\n\n📅 ${formatDateShort(d.date, locale)} · ${decodeTimeSlot(d.time)}\n🔧 ${esc(d.serviceLabel ?? getClientServiceLabel(serviceId, locale))}${checklist ? `\n\n${checklist}` : ""}`,
        clientUserMenu(locale, freshSlice ?? slice)
      );
    } else {
      await replyOrEdit(chatId, messageId, locale, L.saveFailed, clientMainKeyboard(locale));
    }
    return;
  }

  if (data === "cl:cf:call") {
    const freshSession = await getTelegramSession(chatKey);
    const d = freshSession.data ?? sessionData;
    if (!d.serviceId || !d.name || !d.phone) {
      await showClientMenu(chatId, messageId, locale);
      return;
    }
    const result = await createTelegramCallRequest({
      serviceId: d.serviceId,
      clientName: d.name,
      clientPhone: d.phone,
      comment: d.comment,
      telegramProfile: profile,
      locale,
    });
    await clearTelegramSessionKeepLocale(chatKey);
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      result.ok ? `${L.callSaved}\n\n🔧 ${esc(d.serviceLabel ?? "")}` : L.saveFailed,
      clientUserMenu(locale, slice)
    );
    return;
  }

  await showClientMenu(chatId, messageId, locale);
}

export async function handleClientTelegramUpdate(update: {
  message?: TelegramMessage;
  callback_query?: TelegramCallback;
}): Promise<void> {
  if (update.callback_query) {
    await handleClientCallback(update.callback_query);
    return;
  }
  if (update.message) {
    await handleClientMessage(update.message);
  }
}
