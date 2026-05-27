import type { Appointment } from "@/lib/store";
import {
  answerCallbackQuery,
  editTelegramMessage,
  sendTelegramMessage,
} from "@/lib/server/telegram-api";
import {
  clearTelegramSession,
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
import {
  createTelegramBooking,
  createTelegramCallRequest,
  getClientAppointmentsByPhone,
  isValidClientName,
  isValidClientPhone,
} from "./client-booking";
import {
  clientConfirmBookingKeyboard,
  clientConfirmCallKeyboard,
  clientContactsKeyboard,
  clientDateKeyboard,
  clientMainKeyboard,
  clientServiceKeyboard,
  clientSkipCommentKeyboard,
  clientTimeKeyboard,
  formatClientBookingSummary,
} from "./client-keyboards";
import { APPOINTMENT_STATUS_CLIENT, CLIENT } from "./client-labels";
import { decodeTimeSlot, formatDateShort, getClientServiceLabel } from "./client-services";

type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
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

async function replyOrEdit(
  chatId: number,
  messageId: number | undefined,
  text: string,
  keyboard = clientMainKeyboard()
): Promise<void> {
  if (messageId) {
    const ok = await editTelegramMessage(chatId, messageId, text, keyboard);
    if (!ok) await sendTelegramMessage(chatId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

async function showClientMenu(chatId: number, messageId?: number): Promise<void> {
  await clearTelegramSession(String(chatId));
  await replyOrEdit(chatId, messageId, CLIENT.welcome, clientMainKeyboard());
}

function formatMyAppointments(list: Appointment[]): string {
  if (list.length === 0) {
    return `${CLIENT.noAppointments}\n\n${CLIENT.cabinetHint}`;
  }

  const lines = ["📋 <b>Ваши записи</b>", ""];
  for (const a of list) {
    const status = APPOINTMENT_STATUS_CLIENT[a.appointmentStatus] ?? a.appointmentStatus;
    const service = a.serviceIds.map(getClientServiceLabel).join(", ");
    lines.push(
      `<b>${a.date} · ${a.time}</b>`,
      `🔧 ${esc(service)}`,
      `📌 ${status}`,
      ""
    );
  }
  lines.push(CLIENT.cabinetHint);
  return lines.join("\n");
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
  await setTelegramSession(chatKey, {
    step: "client_phone",
    data,
  });
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
  await setTelegramSession(chatKey, {
    step: "client_comment",
    data,
  });
  await replyOrEdit(chatId, messageId, CLIENT.enterComment, clientSkipCommentKeyboard());
}

async function showConfirm(
  chatId: number,
  messageId: number | undefined,
  chatKey: string,
  data: Record<string, string>
): Promise<void> {
  await clearTelegramSession(chatKey);
  const intent = data.intent === "call" ? "call" : "book";
  const summary = formatClientBookingSummary(data);
  const keyboard =
    intent === "call" ? clientConfirmCallKeyboard() : clientConfirmBookingKeyboard();
  await replyOrEdit(chatId, messageId, summary, keyboard);
  await setTelegramSession(chatKey, { data });
}

export async function handleClientMessage(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() ?? "";
  const chatKey = String(chatId);

  if (text === "/start" || text === "/menu") {
    await showClientMenu(chatId);
    return;
  }

  const session = await getTelegramSession(chatKey);

  if (session.step === "client_name") {
    if (!isValidClientName(text)) {
      await sendTelegramMessage(chatId, CLIENT.invalidName, {
        inline_keyboard: [[{ text: CLIENT.cancel, callback_data: "cl:menu" }]],
      });
      return;
    }
    const data = { ...(session.data ?? {}), name: text.trim() };
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
    const data: Record<string, string> = { ...(session.data ?? {}), phone: text.trim() };
    const intent = data.intent === "call" ? "call" : "book";
    if (intent === "call") {
      await promptComment(chatId, undefined, chatKey, data);
    } else {
      await showConfirm(chatId, undefined, chatKey, data);
    }
    return;
  }

  if (session.step === "client_comment") {
    const data = { ...(session.data ?? {}), comment: text.trim() };
    await showConfirm(chatId, undefined, chatKey, data);
    return;
  }

  if (session.step === "client_my_phone") {
    if (!isValidClientPhone(text)) {
      await sendTelegramMessage(chatId, CLIENT.invalidPhone, clientMainKeyboard());
      return;
    }
    await clearTelegramSession(chatKey);
    const list = await getClientAppointmentsByPhone(text);
    await sendTelegramMessage(chatId, formatMyAppointments(list), clientMainKeyboard());
    return;
  }

  if (text.startsWith("/")) {
    await sendTelegramMessage(chatId, CLIENT.welcome, clientMainKeyboard());
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

  await answerCallbackQuery(cb.id);

  const chatKey = String(chatId);
  const session = await getTelegramSession(chatKey);
  const sessionData = session.data ?? {};

  if (data === "cl:menu") {
    await showClientMenu(chatId, messageId);
    return;
  }

  if (data === "cl:contacts") {
    await replyOrEdit(chatId, messageId, CLIENT.contactsText, clientContactsKeyboard());
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

  if (data === "cl:my") {
    await setTelegramSession(chatKey, { step: "client_my_phone", data: {} });
    await replyOrEdit(chatId, messageId, CLIENT.enterPhoneForMy, {
      inline_keyboard: [[{ text: CLIENT.cancel, callback_data: "cl:menu" }]],
    });
    return;
  }

  if (data.startsWith("cl:svc:")) {
    const rest = data.slice(7);
    const colon = rest.indexOf(":");
    const intent = rest.slice(0, colon) as "book" | "call";
    const serviceId = rest.slice(colon + 1);
    const serviceLabel = getClientServiceLabel(serviceId);
    const nextData = { intent, serviceId, serviceLabel };

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
    const nextData = { ...sessionData, time, intent: "book" };
    await promptName(chatId, messageId, chatKey, "book", nextData);
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
        clientMainKeyboard()
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
    if (result.ok) {
      await replyOrEdit(
        chatId,
        messageId,
        `${CLIENT.callSaved}\n\n🔧 ${esc(d.serviceLabel ?? "")}`,
        clientMainKeyboard()
      );
    } else {
      await replyOrEdit(chatId, messageId, CLIENT.saveFailed, clientMainKeyboard());
    }
    return;
  }

  await showClientMenu(chatId, messageId);
}

export async function handleClientTelegramUpdate(update: {
  message?: TelegramMessage;
  callback_query?: TelegramCallback;
}): Promise<void> {
  if (update.callback_query) {
    await handleClientCallback(update.callback_query);
    return;
  }
  if (update.message?.text) {
    await handleClientMessage(update.message);
  }
}
