import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import {
  answerCallbackQuery,
  editTelegramMessage,
  removeReplyKeyboard,
  sendTelegramMessage,
} from "@/lib/server/telegram-api";
import {
  clearTelegramSession,
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
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
  clientConfirmBookingKeyboard,
  clientConfirmCallKeyboard,
  clientContactsKeyboard,
  clientDateKeyboard,
  clientLinkedMenuKeyboard,
  clientMainKeyboard,
  clientOrderDetailKeyboard,
  clientOrdersKeyboard,
  clientServiceKeyboard,
  clientSkipCommentKeyboard,
  clientTimeKeyboard,
  formatClientBookingSummary,
  phoneRequestReplyKeyboard,
} from "./client-keyboards";
import { CLIENT } from "./client-labels";
import {
  getClientPortalByChat,
  linkTelegramClient,
  type TelegramProfile,
} from "./client-telegram-link";
import { decodeTimeSlot, formatDateShort, getClientServiceLabel } from "./client-services";

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

type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
  contact?: TelegramContact;
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

async function replyOrEdit(
  chatId: number,
  messageId: number | undefined,
  text: string,
  keyboard?: Parameters<typeof sendTelegramMessage>[2]
): Promise<void> {
  if (messageId && keyboard && "inline_keyboard" in keyboard) {
    const ok = await editTelegramMessage(chatId, messageId, text, keyboard);
    if (!ok) await sendTelegramMessage(chatId, text, keyboard);
  } else if (messageId) {
    const ok = await editTelegramMessage(chatId, messageId, text, clientMainKeyboard(true));
    if (!ok) await sendTelegramMessage(chatId, text, keyboard ?? clientMainKeyboard());
  } else {
    await sendTelegramMessage(chatId, text, keyboard ?? clientMainKeyboard());
  }
}

async function showClientMenu(
  chatId: number,
  messageId?: number,
  startParam?: string
): Promise<void> {
  await clearTelegramSession(String(chatId));
  const slice = await getClientPortalByChat(String(chatId));

  if (slice) {
    const pending = countPendingSign(slice);
    const unread = countUnread(slice);
    const text = formatLinkedWelcome(slice.user.name);
    const kb = clientLinkedMenuKeyboard(slice, pending, unread);
    await replyOrEdit(chatId, messageId, text, kb);

    if (startParam?.startsWith("sign_")) {
      const orderId = startParam.slice(5);
      const detail = formatWorkOrderDetail(slice, orderId);
      if (detail) {
        const order = slice.workOrders.find((o) => o.id === orderId);
        const needsSign = order?.confirmationStatus !== "confirmed";
        await sendTelegramMessage(
          chatId,
          needsSign
            ? `${CLIENT.signIntro}\n\n${detail}`
            : detail,
          clientOrderDetailKeyboard(orderId, needsSign)
        );
      }
    }
    return;
  }

  let text = CLIENT.welcome;
  if (startParam?.startsWith("sign_")) {
    text = `${CLIENT.signIntro}\n\n${CLIENT.welcome}`;
  }
  await replyOrEdit(chatId, messageId, text, clientMainKeyboard(false));
}

async function startLinkFlow(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  profile: TelegramProfile,
  orderId?: string
): Promise<void> {
  await setTelegramSession(chatKey, {
    step: "client_link_phone",
    data: orderId ? { orderId, linkIntent: "sign" } : { linkIntent: "cabinet" },
  });
  await sendTelegramMessage(chatId, CLIENT.linkIntro, phoneRequestReplyKeyboard());
  if (messageId) {
    await editTelegramMessage(chatId, messageId, CLIENT.linkIntro, clientMainKeyboard(false));
  }
}

async function handleContactShare(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  const chatKey = String(chatId);
  const contact = msg.contact;
  if (!contact) return;

  const session = await getTelegramSession(chatKey);
  const fromId = msg.from?.id;
  if (contact.user_id && fromId && contact.user_id !== fromId) {
    await sendTelegramMessage(chatId, CLIENT.wrongContact, removeReplyKeyboard());
    return;
  }

  const phone = normalizePhone(contact.phone_number);
  if (!phone) {
    await sendTelegramMessage(chatId, CLIENT.invalidPhone, removeReplyKeyboard());
    return;
  }

  await sendTelegramMessage(
    chatId,
    `✅ Номер принят: <b>${esc(phone)}</b>\n\n${CLIENT.enterPlate}`,
    removeReplyKeyboard()
  );

  await setTelegramSession(chatKey, {
    step: "client_link_plate",
    data: {
      ...(session.data ?? {}),
      phone,
      profileChatId: String(chatId),
      telegramUserId: String(fromId ?? chatId),
      telegramUsername: msg.from?.username ?? "",
      firstName: msg.from?.first_name ?? "",
      lastName: msg.from?.last_name ?? "",
    },
  });
}

async function completeLink(
  chatId: number,
  chatKey: string,
  plate: string,
  sessionData: Record<string, string>
): Promise<void> {
  const phone = sessionData.phone;
  if (!phone) {
    await sendTelegramMessage(chatId, CLIENT.invalidPhone, clientMainKeyboard());
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
  });

  await clearTelegramSession(chatKey);

  if (!result.ok) {
    await sendTelegramMessage(chatId, CLIENT.saveFailed, clientMainKeyboard());
    return;
  }

  const slice = await getClientPortalByChat(String(chatId));
  const kb = slice
    ? clientLinkedMenuKeyboard(slice, countPendingSign(slice), countUnread(slice))
    : clientMainKeyboard(true);

  await sendTelegramMessage(chatId, CLIENT.linkSuccess, kb);

  if (sessionData.orderId && slice) {
    const detail = formatWorkOrderDetail(slice, sessionData.orderId);
    if (detail) {
      const order = slice.workOrders.find((o) => o.id === sessionData.orderId);
      const needsSign = order?.confirmationStatus !== "confirmed";
      await sendTelegramMessage(
        chatId,
        detail,
        clientOrderDetailKeyboard(sessionData.orderId, needsSign)
      );
    }
  }
}

async function promptName(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  intent: "book" | "call",
  data: Record<string, string>
): Promise<void> {
  await setTelegramSession(chatKey, {
    step: "client_name",
    data: { ...data, intent },
  });
  await replyOrEdit(chatId, messageId, CLIENT.enterName, {
    inline_keyboard: [[{ text: CLIENT.cancel, callback_data: "cl:menu" }]],
  });
}

async function promptPhone(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  data: Record<string, string>
): Promise<void> {
  await setTelegramSession(chatKey, { step: "client_phone", data });
  await replyOrEdit(chatId, messageId, CLIENT.enterPhone, {
    inline_keyboard: [[{ text: CLIENT.cancel, callback_data: "cl:menu" }]],
  });
}

async function promptComment(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  data: Record<string, string>
): Promise<void> {
  await setTelegramSession(chatKey, { step: "client_comment", data });
  await replyOrEdit(chatId, messageId, CLIENT.enterComment, clientSkipCommentKeyboard());
}

async function showConfirm(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  data: Record<string, string>
): Promise<void> {
  const intent = data.intent === "call" ? "call" : "book";
  const summary = formatClientBookingSummary(data);
  const keyboard =
    intent === "call" ? clientConfirmCallKeyboard() : clientConfirmBookingKeyboard();
  await clearTelegramSession(chatKey);
  await replyOrEdit(chatId, messageId, summary, keyboard);
  await setTelegramSession(chatKey, { data });
}

export async function handleClientMessage(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  const chatKey = String(chatId);
  const text = msg.text?.trim() ?? "";

  if (msg.contact) {
    await handleContactShare(msg);
    return;
  }

  if (text === "/start" || text === "/menu" || text.startsWith("/start ")) {
    await showClientMenu(chatId, undefined, parseStartParam(text));
    return;
  }

  const session = await getTelegramSession(chatKey);

  if (session.step === "client_link_phone") {
    if (!isValidClientPhone(text)) {
      await sendTelegramMessage(chatId, CLIENT.invalidPhone, phoneRequestReplyKeyboard());
      return;
    }
    await sendTelegramMessage(
      chatId,
      `✅ Номер: <b>${esc(normalizePhone(text))}</b>\n\n${CLIENT.enterPlate}`,
      removeReplyKeyboard()
    );
    await setTelegramSession(chatKey, {
      step: "client_link_plate",
      data: {
        ...(session.data ?? {}),
        phone: normalizePhone(text),
        telegramUserId: String(msg.from?.id ?? chatId),
        telegramUsername: msg.from?.username ?? "",
        firstName: msg.from?.first_name ?? "",
        lastName: msg.from?.last_name ?? "",
      },
    });
    return;
  }

  if (session.step === "client_link_plate") {
    const plateKey = normalizePlateKey(text);
    if (plateKey.length < 2) {
      await sendTelegramMessage(chatId, CLIENT.invalidPlate);
      return;
    }
    if (!session.data?.phone) {
      await sendTelegramMessage(chatId, CLIENT.linkIntro, phoneRequestReplyKeyboard());
      await setTelegramSession(chatKey, { step: "client_link_phone", data: session.data ?? {} });
      return;
    }
    await completeLink(chatId, chatKey, text.trim(), session.data);
    return;
  }

  if (session.step === "client_name") {
    if (!isValidClientName(text)) {
      await sendTelegramMessage(chatId, CLIENT.invalidName, {
        inline_keyboard: [[{ text: CLIENT.cancel, callback_data: "cl:menu" }]],
      });
      return;
    }
    const data: Record<string, string> = { ...(session.data ?? {}), name: text.trim() };
    const slice = await getClientPortalByChat(chatKey);
    if (slice?.user.phone) {
      data.phone = slice.user.phone;
      const intent = data.intent === "call" ? "call" : "book";
      if (intent === "call") await promptComment(chatId, undefined, chatKey, data);
      else await showConfirm(chatId, undefined, chatKey, data);
      return;
    }
    await promptPhone(chatId, undefined, chatKey, data);
    return;
  }

  if (session.step === "client_phone") {
    if (!isValidClientPhone(text)) {
      await sendTelegramMessage(chatId, CLIENT.invalidPhone, {
        inline_keyboard: [[{ text: CLIENT.cancel, callback_data: "cl:menu" }]],
      });
      return;
    }
    const data: Record<string, string> = {
      ...(session.data ?? {}),
      phone: normalizePhone(text),
    };
    if (data.intent === "call") await promptComment(chatId, undefined, chatKey, data);
    else await showConfirm(chatId, undefined, chatKey, data);
    return;
  }

  if (session.step === "client_comment") {
    const data = { ...(session.data ?? {}), comment: text.trim() };
    await showConfirm(chatId, undefined, chatKey, data);
    return;
  }

  if (text.startsWith("/")) {
    await showClientMenu(chatId);
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
  const session = await getTelegramSession(chatKey);
  const sessionData = session.data ?? {};
  const slice = await getClientPortalByChat(chatKey);
  const profile = cb.message ? profileFrom(cb.message) : {
    chatId: chatKey,
    telegramUserId: chatId,
  };

  if (data === "cl:menu") {
    await showClientMenu(chatId, messageId);
    return;
  }

  if (data === "cl:link") {
    await startLinkFlow(chatId, messageId, chatKey, profile, sessionData.orderId);
    return;
  }

  if (data === "cl:contacts") {
    await replyOrEdit(chatId, messageId, CLIENT.contactsText, clientContactsKeyboard());
    return;
  }

  if (data.startsWith("cl:orders:")) {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, profile);
      return;
    }
    const page = Number(data.slice(10)) || 0;
    const { text, totalPages } = formatWorkOrdersList(slice, page);
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
      text,
      clientOrdersKeyboard(orders, page, totalPages)
    );
    return;
  }

  if (data.startsWith("cl:wo:")) {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, profile);
      return;
    }
    const orderId = data.slice(6);
    const detail = formatWorkOrderDetail(slice, orderId);
    if (!detail) {
      await replyOrEdit(chatId, messageId, "Заказ-наряд не найден.", clientMainKeyboard(true));
      return;
    }
    const order = slice.workOrders.find((o) => o.id === orderId);
    await replyOrEdit(
      chatId,
      messageId,
      detail,
      clientOrderDetailKeyboard(orderId, order?.confirmationStatus !== "confirmed")
    );
    return;
  }

  if (data === "cl:notif") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, profile);
      return;
    }
    await replyOrEdit(chatId, messageId, formatNotifications(slice), {
      inline_keyboard: [clientBackMenuRow()],
    });
    return;
  }

  if (data === "cl:apts") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, profile);
      return;
    }
    await replyOrEdit(chatId, messageId, formatAppointmentsSlice(slice), {
      inline_keyboard: [clientBackMenuRow()],
    });
    return;
  }

  if (data === "cl:cars") {
    if (!slice) {
      await startLinkFlow(chatId, messageId, chatKey, profile);
      return;
    }
    await replyOrEdit(chatId, messageId, formatCarsSlice(slice), {
      inline_keyboard: [clientBackMenuRow()],
    });
    return;
  }

  if (data === "cl:book") {
    await clearTelegramSession(chatKey);
    await replyOrEdit(chatId, messageId, CLIENT.chooseService, clientServiceKeyboard("book"));
    return;
  }

  if (data === "cl:call") {
    await clearTelegramSession(chatKey);
    await replyOrEdit(chatId, messageId, CLIENT.chooseService, clientServiceKeyboard("call"));
    return;
  }

  if (data.startsWith("cl:svc:")) {
    const rest = data.slice(7);
    const colon = rest.indexOf(":");
    const intent = rest.slice(0, colon) as "book" | "call";
    const serviceId = rest.slice(colon + 1);
    const nextData = {
      intent,
      serviceId,
      serviceLabel: getClientServiceLabel(serviceId),
    };
    if (intent === "call") {
      await promptName(chatId, messageId, chatKey, "call", nextData);
      return;
    }
    await setTelegramSession(chatKey, { data: nextData });
    await replyOrEdit(chatId, messageId, CLIENT.chooseDate, clientDateKeyboard());
    return;
  }

  if (data.startsWith("cl:dt:")) {
    const date = data.slice(6);
    const nextData = { ...sessionData, date };
    await setTelegramSession(chatKey, { data: nextData });
    await replyOrEdit(
      chatId,
      messageId,
      `${CLIENT.chooseTime}\n📅 ${formatDateShort(date)}`,
      clientTimeKeyboard()
    );
    return;
  }

  if (data.startsWith("cl:tm:")) {
    const time = decodeTimeSlot(data.slice(6));
    await promptName(chatId, messageId, chatKey, "book", {
      ...sessionData,
      time,
      intent: "book",
    });
    return;
  }

  if (data === "cl:skip") {
    await showConfirm(chatId, messageId, chatKey, sessionData);
    return;
  }

  if (data === "cl:cf:book") {
    const d = sessionData;
    if (!d.serviceId || !d.date || !d.time || !d.name || !d.phone) {
      await showClientMenu(chatId, messageId);
      return;
    }
    const result = await createTelegramBooking({
      serviceId: d.serviceId,
      date: d.date,
      time: decodeTimeSlot(d.time),
      clientName: d.name,
      clientPhone: d.phone,
      comment: d.comment,
    });
    await clearTelegramSession(chatKey);
    if (result.ok) {
      await replyOrEdit(
        chatId,
        messageId,
        `${CLIENT.saved}\n\n📅 ${formatDateShort(d.date)} · ${decodeTimeSlot(d.time)}\n🔧 ${esc(d.serviceLabel ?? "")}`,
        slice
          ? clientLinkedMenuKeyboard(slice, countPendingSign(slice), countUnread(slice))
          : clientMainKeyboard(false)
      );
    } else {
      await replyOrEdit(chatId, messageId, CLIENT.saveFailed, clientMainKeyboard());
    }
    return;
  }

  if (data === "cl:cf:call") {
    const d = sessionData;
    if (!d.serviceId || !d.name || !d.phone) {
      await showClientMenu(chatId, messageId);
      return;
    }
    const result = await createTelegramCallRequest({
      serviceId: d.serviceId,
      clientName: d.name,
      clientPhone: d.phone,
      comment: d.comment,
    });
    await clearTelegramSession(chatKey);
    await replyOrEdit(
      chatId,
      messageId,
      result.ok ? `${CLIENT.callSaved}\n\n🔧 ${esc(d.serviceLabel ?? "")}` : CLIENT.saveFailed,
      clientMainKeyboard(!!slice)
    );
    return;
  }

  await showClientMenu(chatId, messageId);
}

function clientBackMenuRow() {
  return [{ text: CLIENT.menu, callback_data: "cl:menu" }];
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
