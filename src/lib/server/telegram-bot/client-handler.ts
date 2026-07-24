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
  formatAppointmentsSlice,
  formatCarsSlice,
  formatFleetFinanceReport,
  formatVehicleFinanceDetail,
  formatLinkedWelcome,
  formatNotifications,
  formatWorkOrderDetail,
  formatClientHistoryList,
  historyKeyboardLabels,
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
  consumePendingRefCode,
  consumePendingStartParam,
  getClientLocale,
  saveClientLocale,
  setClientTelegramSession,
  stashPendingRefCode,
  stashPendingStartParam,
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
  clientServiceCategoryKeyboard,
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
  continueWithServiceSelection,
  finalizeCustomService,
  handleServiceCategoryPick,
  linkedProfileData,
  promptComment,
  promptCustomService,
  promptName,
  promptPhone,
  replyOrEdit,
  showConfirm,
  showCustomServiceConfirm,
} from "./client-booking-flow";
import {
  getClientPortalByChat,
  linkTelegramClient,
  tryRestoreTelegramChatLink,
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
import { formatTelegramSaveError } from "./client-telegram-errors";
import { isFleetPortalClient } from "@/lib/client-fleet-access";
import {
  clientFleetCarKeyboard,
  clientFleetFinanceKeyboard,
} from "./client-fleet-keyboards";

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
  const pending = startParam ?? (await consumePendingStartParam(chatKey));
  await saveClientLocale(chatKey, locale);
  const L = getClientBotLabels(locale);
  const savedText = L.languageSaved(LANGUAGE_NAMES[locale]);
  if (messageId) {
    await editTelegramMessage(chatId, messageId, savedText);
  } else {
    await sendTelegramMessage(chatId, savedText);
  }
  await attachStartKeyboard(chatId, locale);
  await showClientMenu(chatId, undefined, locale, pending);
  await handleStartDeepLinks(chatId, locale, pending);
}

function minimalTelegramProfile(chatId: number): TelegramProfile {
  return {
    chatId: String(chatId),
    telegramUserId: chatId,
  };
}

async function handleStartDeepLinks(
  chatId: number,
  locale: BotLocale,
  startParam?: string
): Promise<void> {
  if (!startParam) return;
  const chatKey = String(chatId);

  if (startParam === "link") {
    await startLinkFlow(chatId, undefined, chatKey, locale, minimalTelegramProfile(chatId));
    return;
  }
  if (startParam === "rebook" || startParam.startsWith("rebook_")) {
    const aptId = startParam.startsWith("rebook_") ? startParam.slice(7) || undefined : undefined;
    await rebookLastAppointment(chatId, chatKey, locale, aptId);
    return;
  }
  if (startParam === "booking") {
    const L = getClientBotLabels(locale);
    await clearTelegramSessionKeepLocale(chatKey);
    await sendTelegramMessage(chatId, L.chooseCategory, clientServiceCategoryKeyboard(locale, "book"));
    return;
  }

  if (startParam.startsWith("ref_")) {
    const code = startParam.slice(4).trim();
    if (!code) return;
    const slice = await getClientPortalByChat(chatKey);
    if (slice) {
      await applyReferralFromStart(chatKey, code);
    } else {
      await stashPendingRefCode(chatKey, code);
    }
    return;
  }
  if (startParam.startsWith("apt_")) {
    await handleAptStartParam(chatId, locale, startParam.slice(4));
    return;
  }
}

function clientUserMenu(
  locale: BotLocale,
  slice: ClientPortalSlice | null | undefined
): ReturnType<typeof clientMenuForUser> {
  return clientMenuForUser(locale, slice);
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
  await tryRestoreTelegramChatLink(minimalTelegramProfile(chatId));
  const slice = await getClientPortalByChat(chatKey);

  if (slice) {
    const text = formatLinkedWelcome(locale, slice.user.name);
    const kb = clientUserMenu(locale, slice);
    await replyOrEdit(chatId, messageId, locale, text, kb);
    return;
  }

  await replyOrEdit(chatId, messageId, locale, L.welcome, clientMainKeyboard(locale, false));
}

async function startLinkFlow(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  locale: BotLocale,
  _profile: TelegramProfile
): Promise<void> {
  const L = getClientBotLabels(locale);
  await promptLinkPhone(chatId, chatKey, locale, { linkIntent: "cabinet" });
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
    await sendTelegramMessage(
      chatId,
      formatTelegramSaveError(locale, result.error),
      clientMainKeyboard(locale)
    );
    return;
  }

  const slice = await getClientPortalByChat(String(chatId));
  const kb = clientUserMenu(locale, slice);

  await sendTelegramMessage(chatId, L.linkSuccess, kb);

  const pendingRef = await consumePendingRefCode(chatKey);
  if (pendingRef) {
    await applyReferralFromStart(chatKey, pendingRef);
  }
}

export async function handleClientMessage(msg: TelegramMessage): Promise<void> {
  try {
    await handleClientMessageInner(msg);
  } catch (e) {
    console.error("[telegram client message]", e);
    const chatId = msg.chat.id;
    const locale = (await getClientLocale(String(chatId))) ?? "ru";
    await sendTelegramMessage(chatId, getClientBotLabels(locale).saveFailed);
  }
}

async function handleClientMessageInner(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  const chatKey = String(chatId);
  const text = msg.text?.trim() ?? "";

  if (text.startsWith("/start") || text === "/menu" || isStartCommand(text)) {
    const locale = await getClientLocale(chatKey);
    if (!locale) {
      const startParam = parseStartParam(text);
      if (startParam) await stashPendingStartParam(chatKey, startParam);
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
      const hint = L.photoUploadHint;
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
    const photoMsg =
      res.ok && res.orderNumber
        ? L.photoSaved(res.orderNumber)
        : formatTelegramSaveError(locale, res.error);
    await sendTelegramMessage(chatId, photoMsg, kb);
    return;
  }

  const session = await getTelegramSession(chatKey);

  if (session.step === "client_symptom") {
    const selected = parseSelectedSymptoms(session.data ?? {});
    const hint = L.symptomPickHint;
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

  if (session.step === "client_custom_service") {
    const trimmed = text.trim();
    if (trimmed.length < 5) {
      await sendTelegramMessage(chatId, L.invalidCustomService, {
        inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]],
      });
      return;
    }
    const data = { ...(session.data ?? {}), customServiceText: trimmed };
    await showCustomServiceConfirm(chatId, undefined, chatKey, locale, data);
    return;
  }

  if (session.step === "client_custom_confirm") {
    await sendTelegramMessage(chatId, L.linkConfirmHint, {
      inline_keyboard: [
        [{ text: L.customServiceYes, callback_data: "cl:cust:ok" }],
        [{ text: L.customServiceEdit, callback_data: "cl:cust:edit" }],
      ],
    });
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
          L.bookingDraftTitle,
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
    const hint = L.confirmAboveHint;
    await sendTelegramMessage(chatId, hint);
    return;
  }

  if (text.startsWith("/")) {
    await showClientMenu(chatId, undefined, locale);
  }
}

export async function handleClientCallback(cb: TelegramCallback): Promise<void> {
  try {
    await handleClientCallbackInner(cb);
  } catch (e) {
    console.error("[telegram client callback]", e);
    const chatId = cb.message?.chat.id;
    if (chatId) {
      const chatKey = String(chatId);
      const locale = (await getClientLocale(chatKey)) ?? "ru";
      await answerCallbackQuery(cb.id, getClientBotLabels(locale).saveFailed.slice(0, 180)).catch(
        () => null
      );
      await sendTelegramMessage(chatId, getClientBotLabels(locale).saveFailed);
    } else {
      await answerCallbackQuery(cb.id).catch(() => null);
    }
  }
}

async function handleClientCallbackInner(cb: TelegramCallback): Promise<void> {
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
      const pending = await consumePendingStartParam(chatKey);
      await onLocaleChosen(chatId, code, messageId, pending);
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

  if (data === "cl:book:draft") {
    await advanceBookingFlow(chatId, messageId, chatKey, locale, sessionData, slice);
    return;
  }

  if (
    data === "cl:status" ||
    data === "cl:history" ||
    data === "cl:referral" ||
    data === "cl:photo" ||
    data === "cl:warranty" ||
    data === "cl:rebook7" ||
    data === "cl:concierge" ||
    data === "cl:quiet" ||
    data === "cl:veh:pick" ||
    data.startsWith("cl:veh:") ||
    data.startsWith("cl:apt:") ||
    data === "cl:rebook" ||
    data.startsWith("cl:rebook:") ||
    data === "cl:notify" ||
    data.startsWith("cl:np:") ||
    data.startsWith("cl:share:apt:") ||
    data.startsWith("cl:extra:") ||
    data.startsWith("cl:repeat:") ||
    data.startsWith("cl:fu:") ||
    data.startsWith("cl:rate:") ||
    data === "cl:vin" ||
    data.startsWith("cl:vin:") ||
    data === "cl:link" ||
    data.startsWith("cl:lk:") ||
    data.startsWith("cl:orders:") ||
    data.startsWith("cl:wo:") ||
    data === "cl:notif" ||
    data === "cl:apts" ||
    data === "cl:finance" ||
    data.startsWith("cl:fin:") ||
    data === "cl:cars"
  ) {
    await replyOrEdit(
      chatId,
      messageId,
      locale,
      L.chooseCategory,
      clientServiceCategoryKeyboard(locale, "book")
    );
    return;
  }

  if (data === "cl:contacts") {
    await replyOrEdit(chatId, messageId, locale, L.contactsText, clientContactsKeyboard(locale));
    return;
  }

  if (data === "cl:book") {
    if (sessionData.serviceId && sessionData.intent === "book") {
      await advanceBookingFlow(chatId, messageId, chatKey, locale, sessionData, slice);
      return;
    }
    await clearTelegramSessionKeepLocale(chatKey);
    await replyOrEdit(chatId, messageId, locale, L.chooseCategory, clientServiceCategoryKeyboard(locale, "book"));
    return;
  }

  if (data === "cl:call") {
    await clearTelegramSessionKeepLocale(chatKey);
    await replyOrEdit(chatId, messageId, locale, L.chooseCategory, clientServiceCategoryKeyboard(locale, "call"));
    return;
  }

  if (data.startsWith("cl:cat:")) {
    const rest = data.slice(7);
    const colon = rest.indexOf(":");
    const intent = rest.slice(0, colon) as "book" | "call";
    const categoryId = rest.slice(colon + 1);
    await handleServiceCategoryPick(chatId, messageId, chatKey, locale, intent, categoryId, slice);
    return;
  }

  if (data.startsWith("cl:opt:")) {
    const rest = data.slice(7);
    const parts = rest.split(":");
    const intent = parts[0] as "book" | "call";
    const categoryId = parts[1] ?? "";
    const optionId = parts.slice(2).join(":") || "_default";
    await continueWithServiceSelection(
      chatId,
      messageId,
      chatKey,
      locale,
      intent,
      categoryId,
      optionId,
      slice
    );
    return;
  }

  if (data.startsWith("cl:cu:")) {
    const intent = data.slice(6) as "book" | "call";
    await promptCustomService(chatId, messageId, chatKey, locale, intent);
    return;
  }

  if (data === "cl:cust:ok") {
    const fresh = await getTelegramSession(chatKey);
    const d = fresh.data ?? sessionData;
    if (!d.customServiceText?.trim()) {
      await promptCustomService(
        chatId,
        messageId,
        chatKey,
        locale,
        d.intent === "call" ? "call" : "book"
      );
      return;
    }
    await finalizeCustomService(chatId, messageId, chatKey, locale, d, slice);
    return;
  }

  if (data === "cl:cust:edit") {
    const fresh = await getTelegramSession(chatKey);
    const d = fresh.data ?? sessionData;
    await promptCustomService(
      chatId,
      messageId,
      chatKey,
      locale,
      d.intent === "call" ? "call" : "book"
    );
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
    if (!d.serviceId || !d.name || !d.phone) {
      await advanceBookingFlow(chatId, messageId, chatKey, locale, d, slice);
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
      result.ok
        ? `${L.callSaved}\n\n🔧 ${esc(d.serviceLabel ?? "")}`
        : formatTelegramSaveError(locale, result.error),
      clientUserMenu(locale, slice)
    );
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
      result.ok
        ? `${L.callSaved}\n\n🔧 ${esc(d.serviceLabel ?? "")}`
        : formatTelegramSaveError(locale, result.error),
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
  try {
    if (update.callback_query) {
      await handleClientCallback(update.callback_query);
      return;
    }
    if (update.message) {
      await handleClientMessage(update.message);
    }
  } catch (e) {
    console.error("[telegram client update]", e);
    const chatId =
      update.message?.chat.id ?? update.callback_query?.message?.chat.id;
    if (chatId) {
      const locale = (await getClientLocale(String(chatId))) ?? "ru";
      await sendTelegramMessage(chatId, getClientBotLabels(locale).saveFailed);
    }
  }
}
