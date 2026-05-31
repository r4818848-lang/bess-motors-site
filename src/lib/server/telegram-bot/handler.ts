import type { ReportPeriod } from "@/lib/crm-analytics";
import { computeCrmAnalytics } from "@/lib/crm-analytics";
import { getWebsiteHotOrders } from "@/lib/hot-orders";
import { getPriceItem } from "@/lib/price-list";
import type { ExpenseCategory, RepairStatus } from "@/lib/store";
import {
  answerCallbackQuery,
  isAuthorizedChat,
  sendTelegramMessage,
  updateTelegramInlineScreen,
} from "@/lib/server/telegram-api";
import {
  clearTelegramSession,
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
import {
  addExpenseToCrm,
  applyWorkOrderStatus,
  confirmHotBooking,
  isValidDateKey,
  loadCrmFromCloud,
  markCallAsCalled,
  markWorkOrderPaid,
  parseExpenseInput,
  searchCrm,
} from "./crm-actions";
import {
  formatAppointments,
  formatExpensesList,
  formatFinanceReport,
  formatHotBookingDetail,
  formatHotCallDetail,
  formatHotOrders,
  formatMarketingReport,
  formatMechanicsReport,
  formatMonthCompare,
  formatSearchResults,
  formatTodaySummary,
  formatTopClients,
  formatUnpaidList,
  formatWorkOrderDetail,
  formatWorkOrderList,
  searchOrderNumbers,
  workOrderListKeyboard,
} from "./format";
import {
  formatWarehouseDetailed,
  formatWarehouseLowOnly,
  warehouseKeyboard,
} from "./admin-warehouse";
import {
  analyticsKeyboard,
  backMenuRow,
  expenseCategoryKeyboard,
  expenseMenuKeyboard,
  financePeriodKeyboard,
  hotBookingDetailKeyboard,
  hotCallDetailKeyboard,
  hotOrdersListKeyboard,
  mainMenuKeyboard,
  mechanicPeriodKeyboard,
  searchResultsKeyboard,
  unpaidOrdersKeyboard,
  workOrderDetailKeyboard,
  workOrderStatusConfirmKeyboard,
  workOrderStatusPickKeyboard,
} from "./keyboards";
import { BOT, REPAIR_STATUS_RU } from "./labels";
import { handleClientTelegramUpdate } from "./client-handler";
import { handleMechanicTelegramUpdate, mechanicDashKeyboard } from "./mechanic-handler";
import { isAdminTelegramChat, resolveMechanicActor } from "./telegram-actor";
import {
  formatUnsignedList,
  remindClientToSign,
  unsignedKeyboard,
} from "./admin-unsigned";
import {
  formatOpenCallsList,
  markCallDone,
  openCallsKeyboard,
} from "./admin-calls";
import {
  createQuickAppointment,
  parseQuickAptLine,
} from "./admin-quick-apt";
import {
  masterTemplateKeyboard,
  sendMasterTemplateToClient,
  type MasterTemplate,
} from "./admin-client-notify";
import { formatMechanicDashboard } from "./admin-mechanic-dash";
import {
  parseExtraWorkLines,
  requestExtraWorkApproval,
} from "./extra-work-approval";

type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
};

type TelegramCallback = {
  id: string;
  message?: TelegramMessage;
  data?: string;
  from?: { id: number };
};

function serviceLabel(id: string): string {
  return getPriceItem(id)?.nameRu ?? id;
}

function parseWoStatus(
  data: string,
  prefix: string
): { number: string; status: RepairStatus } | null {
  if (!data.startsWith(prefix)) return null;
  const rest = data.slice(prefix.length);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon === -1) return null;
  const number = rest.slice(0, lastColon);
  const status = rest.slice(lastColon + 1) as RepairStatus;
  if (!REPAIR_STATUS_RU[status]) return null;
  return { number, status };
}

async function replyOrEdit(
  chatId: number,
  messageId: number | undefined,
  text: string,
  keyboard = mainMenuKeyboard()
): Promise<void> {
  await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
}

async function showMainMenu(chatId: number, messageId?: number): Promise<void> {
  await clearTelegramSession(String(chatId));
  await replyOrEdit(chatId, messageId, BOT.welcome, mainMenuKeyboard());
}

async function runSearch(chatId: number, query: string, messageId?: number): Promise<void> {
  const db = await loadCrmFromCloud();
  if (!db) {
    await replyOrEdit(chatId, messageId, BOT.cloudOff, mainMenuKeyboard());
    return;
  }

  const hits = searchCrm(db, query);
  const text = formatSearchResults(db, hits);
  const orderNums = searchOrderNumbers(hits);
  const keyboard =
    orderNums.length > 0 ? searchResultsKeyboard(orderNums) : mainMenuKeyboard();
  await replyOrEdit(chatId, messageId, text, keyboard);
}

export async function handleTelegramUpdate(update: {
  message?: TelegramMessage;
  callback_query?: TelegramCallback;
}): Promise<void> {
  const chatId =
    update.message?.chat.id ?? update.callback_query?.message?.chat.id;

  if (chatId === undefined) return;

  if (!isAdminTelegramChat(chatId)) {
    const mechanic = await resolveMechanicActor(chatId);
    if (mechanic) {
      await handleMechanicTelegramUpdate(update, mechanic);
      return;
    }
    await handleClientTelegramUpdate(update);
    return;
  }

  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
  if (update.message?.text) {
    await handleMessage(update.message);
  }
}

async function handleMessage(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() ?? "";
  const chatKey = String(chatId);

  if (text === "/start" || text === "/menu") {
    await showMainMenu(chatId);
    return;
  }

  if (text.startsWith("/find ")) {
    const query = text.slice(6).trim();
    if (query.length < 2) {
      await sendTelegramMessage(chatId, BOT.searchPrompt, mainMenuKeyboard());
      return;
    }
    await clearTelegramSession(chatKey);
    await runSearch(chatId, query);
    return;
  }

  if (text === "/help") {
    await sendTelegramMessage(chatId, BOT.helpText, mainMenuKeyboard());
    return;
  }

  const session = await getTelegramSession(chatKey);

  if (session.step === "admin_extra_work" && session.data?.orderNumber) {
    const lines = text.split("\n");
    const note = lines[0] ?? "Дополнительные работы";
    const workLines = parseExtraWorkLines(
      (lines.slice(1).join("\n") || lines[0]) ?? ""
    );
    await clearTelegramSession(chatKey);
    const res = await requestExtraWorkApproval(
      session.data.orderNumber,
      workLines.length ? workLines : parseExtraWorkLines(text),
      note
    );
    await sendTelegramMessage(chatId, res.message, mainMenuKeyboard());
    return;
  }

  if (session.step === "admin_custom_msg" && session.data?.orderNumber) {
    const number = session.data.orderNumber;
    const db = await loadCrmFromCloud();
    const order = db?.workOrders.find((o) => o.number === number);
    const user = order ? db?.users.find((u) => u.id === order.userId) : undefined;
    await clearTelegramSession(chatKey);
    if (user?.telegramChatId) {
      await sendTelegramMessage(user.telegramChatId, `📨 <b>BESS MOTORS</b>\n\n${text}`);
      await sendTelegramMessage(chatId, BOT.saved, mainMenuKeyboard());
    } else {
      await sendTelegramMessage(chatId, "Клиент не в Telegram.", mainMenuKeyboard());
    }
    return;
  }

  if (session.step === "admin_quick_apt") {
    const parsed = parseQuickAptLine(text);
    await clearTelegramSession(chatKey);
    if (!parsed.ok || !parsed.phone || !parsed.date || !parsed.time) {
      await sendTelegramMessage(chatId, BOT.quickAptPrompt, mainMenuKeyboard());
      return;
    }
    const result = await createQuickAppointment({
      phone: parsed.phone,
      date: parsed.date,
      time: parsed.time,
      comment: parsed.comment ?? "Telegram CRM",
    });
    await sendTelegramMessage(
      chatId,
      result.ok
        ? `${BOT.saved}\n📅 ${parsed.date} ${parsed.time}\n📱 ${parsed.phone}`
        : BOT.saveFailed,
      mainMenuKeyboard()
    );
    return;
  }

  if (session.step === "search_input") {
    if (text.length < 2) {
      await sendTelegramMessage(chatId, BOT.searchPrompt, {
        inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
      });
      return;
    }
    await clearTelegramSession(chatKey);
    await runSearch(chatId, text);
    return;
  }

  if (session.step === "expense_input" && session.data?.category) {
    const parsed = parseExpenseInput(text, session.data.category as ExpenseCategory);
    if (!parsed.ok) {
      await sendTelegramMessage(chatId, BOT.invalidExpense, expenseCategoryKeyboard());
      return;
    }
    const result = await addExpenseToCrm(parsed.expense);
    await clearTelegramSession(chatKey);
    if (result.ok) {
      await sendTelegramMessage(
        chatId,
        `${BOT.saved}\n\n💸 ${parsed.expense.description}\n<b>${parsed.expense.amount.toFixed(2)} zł</b> · ${parsed.expense.date}`,
        expenseMenuKeyboard()
      );
    } else {
      await sendTelegramMessage(chatId, BOT.saveFailed, mainMenuKeyboard());
    }
    return;
  }

  if (session.step === "report_custom_from") {
    if (!isValidDateKey(text)) {
      await sendTelegramMessage(chatId, BOT.invalidDate);
      return;
    }
    await setTelegramSession(chatKey, { step: "report_custom_to", data: { from: text } });
    await sendTelegramMessage(chatId, BOT.customTo);
    return;
  }

  if (session.step === "report_custom_to" && session.data?.from) {
    if (!isValidDateKey(text)) {
      await sendTelegramMessage(chatId, BOT.invalidDate);
      return;
    }
    const from = session.data.from;
    const to = text;
    await clearTelegramSession(chatKey);

    const db = await loadCrmFromCloud();
    if (!db) {
      await sendTelegramMessage(chatId, BOT.cloudOff, mainMenuKeyboard());
      return;
    }
    const stats = computeCrmAnalytics(db, "custom", from, to);
    const report = formatFinanceReport(stats, "custom", `${from} — ${to}`);
    await sendTelegramMessage(chatId, report, financePeriodKeyboard());
    return;
  }

  if (text.startsWith("/tpl")) {
    const { formatTemplatesList, getTemplateById } = await import("./admin-templates");
    const id = text.trim().split(/\s+/)[1];
    if (!id) {
      await sendTelegramMessage(
        chatId,
        `📋 <b>Szablony wiadomości</b>\n\n${formatTemplatesList()}`,
        mainMenuKeyboard()
      );
      return;
    }
    const tpl = getTemplateById(id);
    await sendTelegramMessage(
      chatId,
      tpl ? `${tpl.label}:\n\n${tpl.pl}` : "Nie znaleziono. /tpl",
      mainMenuKeyboard()
    );
    return;
  }

  if (text.startsWith("/")) {
    await sendTelegramMessage(chatId, BOT.helpText, mainMenuKeyboard());
  }
}

async function handleCallback(cb: TelegramCallback): Promise<void> {
  const chatId = cb.message?.chat.id;
  const messageId = cb.message?.message_id;
  const data = cb.data ?? "";

  if (!chatId || !isAuthorizedChat(chatId)) {
    await answerCallbackQuery(cb.id, BOT.unauthorized);
    return;
  }

  if (data === "noop") {
    await answerCallbackQuery(cb.id);
    return;
  }

  await answerCallbackQuery(cb.id);

  if (data === "menu") {
    await showMainMenu(chatId, messageId);
    return;
  }

  if (data === "help") {
    await replyOrEdit(chatId, messageId, BOT.helpText, mainMenuKeyboard());
    return;
  }

  if (data === "search:menu") {
    const chatKey = String(chatId);
    await setTelegramSession(chatKey, { step: "search_input", data: {} });
    await replyOrEdit(chatId, messageId, BOT.searchPrompt, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return;
  }

  const db = await loadCrmFromCloud();
  if (!db) {
    await replyOrEdit(chatId, messageId, BOT.cloudOff, mainMenuKeyboard());
    return;
  }

  const chatKey = String(chatId);

  if (data === "fin:menu") {
    await replyOrEdit(chatId, messageId, BOT.choosePeriod, financePeriodKeyboard());
    return;
  }

  if (data.startsWith("fin:")) {
    const period = data.slice(4) as ReportPeriod;
    if (period === "custom") {
      await setTelegramSession(chatKey, { step: "report_custom_from", data: {} });
      await replyOrEdit(chatId, messageId, BOT.customFrom, {
        inline_keyboard: [[{ text: BOT.back, callback_data: "fin:menu" }]],
      });
      return;
    }
    const stats = computeCrmAnalytics(db, period, "", "");
    const report = formatFinanceReport(stats, period);
    await replyOrEdit(chatId, messageId, report, financePeriodKeyboard());
    return;
  }

  if (data === "sum:day") {
    await replyOrEdit(chatId, messageId, formatTodaySummary(db), mainMenuKeyboard());
    return;
  }

  if (data === "calls:0") {
    await replyOrEdit(chatId, messageId, formatOpenCallsList(db), openCallsKeyboard(db));
    return;
  }

  if (data.startsWith("calls:done:")) {
    const callId = data.slice(11);
    await markCallDone(callId);
    const freshDb = (await loadCrmFromCloud()) ?? db;
    await replyOrEdit(
      chatId,
      messageId,
      formatOpenCallsList(freshDb),
      openCallsKeyboard(freshDb)
    );
    return;
  }

  if (data === "qapt:menu") {
    await setTelegramSession(chatKey, { step: "admin_quick_apt", data: {} });
    await replyOrEdit(chatId, messageId, BOT.quickAptPrompt, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return;
  }

  if (data === "unsigned:0") {
    await replyOrEdit(chatId, messageId, formatUnsignedList(db), unsignedKeyboard(db));
    return;
  }

  if (data.startsWith("unsigned:remind:")) {
    const orderId = data.slice(16);
    const res = await remindClientToSign(db, orderId);
    const freshDb = (await loadCrmFromCloud()) ?? db;
    await replyOrEdit(
      chatId,
      messageId,
      `${res.message}\n\n${formatUnsignedList(freshDb)}`,
      unsignedKeyboard(freshDb)
    );
    return;
  }

  if (data.startsWith("wo:p:")) {
    const page = Number(data.slice(5)) || 0;
    const { text } = formatWorkOrderList(db, page);
    await replyOrEdit(chatId, messageId, text, workOrderListKeyboard(db, page));
    return;
  }

  if (data.startsWith("wo:chg:")) {
    const number = data.slice(7);
    await replyOrEdit(
      chatId,
      messageId,
      `🔄 Выберите новый статус для <b>${number}</b>:`,
      workOrderStatusPickKeyboard(number)
    );
    return;
  }

  if (data.startsWith("wo:pre:")) {
    const parsed = parseWoStatus(data, "wo:pre:");
    if (!parsed) {
      await replyOrEdit(chatId, messageId, "Ошибка данных.", mainMenuKeyboard());
      return;
    }
    const { number, status } = parsed;
    const order = db.workOrders.find((x) => x.number === number);
    if (!order) {
      await replyOrEdit(chatId, messageId, "Заказ-наряд не найден.", workOrderListKeyboard(db, 0));
      return;
    }
    await replyOrEdit(
      chatId,
      messageId,
      `Подтвердите смену статуса <b>${number}</b>:\n${REPAIR_STATUS_RU[order.status]} → <b>${REPAIR_STATUS_RU[status]}</b>`,
      workOrderStatusConfirmKeyboard(number, status)
    );
    return;
  }

  if (data.startsWith("wo:cf:")) {
    const parsed = parseWoStatus(data, "wo:cf:");
    if (!parsed) {
      await replyOrEdit(chatId, messageId, "Ошибка данных.", mainMenuKeyboard());
      return;
    }
    const result = await applyWorkOrderStatus(parsed.number, parsed.status);
    const freshDb = (await loadCrmFromCloud()) ?? db;
    const detail = formatWorkOrderDetail(freshDb, parsed.number);
    const order = freshDb.workOrders.find((x) => x.number === parsed.number);
    if (!result.ok || !detail) {
      await replyOrEdit(chatId, messageId, BOT.saveFailed, workOrderListKeyboard(freshDb, 0));
      return;
    }
    await replyOrEdit(
      chatId,
      messageId,
      `${BOT.statusChanged}\n\n${detail}`,
      workOrderDetailKeyboard(parsed.number, order?.paymentStatus === "paid")
    );
    return;
  }

  if (data.startsWith("wo:pay:") || data.startsWith("wo:unpay:")) {
    const paid = data.startsWith("wo:pay:");
    const number = data.slice(paid ? 7 : 9);
    const result = await markWorkOrderPaid(number, paid);
    const freshDb = (await loadCrmFromCloud()) ?? db;
    const detail = formatWorkOrderDetail(freshDb, number);
    const order = freshDb.workOrders.find((x) => x.number === number);
    if (!result.ok || !detail) {
      await replyOrEdit(chatId, messageId, BOT.saveFailed, workOrderListKeyboard(freshDb, 0));
      return;
    }
    await replyOrEdit(
      chatId,
      messageId,
      `${BOT.saved}\n\n${detail}`,
      workOrderDetailKeyboard(number, order?.paymentStatus === "paid")
    );
    return;
  }

  if (data.startsWith("wo:msg:")) {
    const number = data.slice(7);
    await replyOrEdit(chatId, messageId, `📨 Шаблон для <b>${number}</b>:`, masterTemplateKeyboard(number));
    return;
  }

  if (data.startsWith("wo:tpl:")) {
    const rest = data.slice(7);
    const lastColon = rest.lastIndexOf(":");
    const number = rest.slice(0, lastColon);
    const template = rest.slice(lastColon + 1) as MasterTemplate;
    const res = await sendMasterTemplateToClient(db, number, template);
    await replyOrEdit(chatId, messageId, res.message, masterTemplateKeyboard(number));
    return;
  }

  if (data.startsWith("wo:extra:")) {
    const number = data.slice(9);
    await setTelegramSession(chatKey, {
      step: "admin_extra_work",
      data: { orderNumber: number },
    });
    await replyOrEdit(
      chatId,
      messageId,
      BOT.extraWorkPrompt.replace("{number}", number),
      { inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]] }
    );
    return;
  }

  if (data.startsWith("wo:custom:")) {
    const number = data.slice(10);
    await setTelegramSession(chatKey, {
      step: "admin_custom_msg",
      data: { orderNumber: number },
    });
    await replyOrEdit(
      chatId,
      messageId,
      BOT.customMsgPrompt.replace("{number}", number),
      { inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]] }
    );
    return;
  }

  if (data === "mech:dash:menu") {
    await replyOrEdit(chatId, messageId, "🔧 <b>Загрузка цеха</b>\n\nВыберите период:", mechanicDashKeyboard());
    return;
  }

  if (data.startsWith("mech:dash:")) {
    const period = data.slice(10) as ReportPeriod;
    const report = formatMechanicDashboard(db, period);
    await replyOrEdit(chatId, messageId, report, mechanicDashKeyboard());
    return;
  }

  if (data.startsWith("wo:n:")) {
    const number = data.slice(5);
    const detail = formatWorkOrderDetail(db, number);
    if (!detail) {
      await replyOrEdit(chatId, messageId, "Заказ-наряд не найден.", workOrderListKeyboard(db, 0));
      return;
    }
    const order = db.workOrders.find((x) => x.number === number);
    await replyOrEdit(
      chatId,
      messageId,
      detail,
      workOrderDetailKeyboard(number, order?.paymentStatus === "paid")
    );
    return;
  }

  if (data.startsWith("hot:d:")) {
    const rest = data.slice(6);
    const colon = rest.indexOf(":");
    const kind = rest.slice(0, colon);
    const id = rest.slice(colon + 1);
    if (kind === "b") {
      const detail = formatHotBookingDetail(db, id);
      if (!detail) {
        await replyOrEdit(chatId, messageId, "Запись не найдена.", mainMenuKeyboard());
        return;
      }
      const apt = db.appointments.find((a) => a.id === id);
      await replyOrEdit(
        chatId,
        messageId,
        detail,
        hotBookingDetailKeyboard(id, Boolean(apt?.workOrderId))
      );
      return;
    }
    if (kind === "c") {
      const detail = formatHotCallDetail(db, id);
      if (!detail) {
        await replyOrEdit(chatId, messageId, "Заявка не найдена.", mainMenuKeyboard());
        return;
      }
      await replyOrEdit(chatId, messageId, detail, hotCallDetailKeyboard(id));
      return;
    }
    return;
  }

  if (data.startsWith("hot:cb:")) {
    const aptId = data.slice(7);
    const result = await confirmHotBooking(aptId);
    const freshDb = (await loadCrmFromCloud()) ?? db;
    const detail = formatHotBookingDetail(freshDb, aptId);
    if (!result.ok || !detail) {
      await replyOrEdit(chatId, messageId, BOT.saveFailed, mainMenuKeyboard());
      return;
    }
    const msg = result.woNumber
      ? `${BOT.saved}\nСоздан заказ-наряд: <b>${result.woNumber}</b>\n\n${detail}`
      : `${BOT.saved}\n\n${detail}`;
    await replyOrEdit(
      chatId,
      messageId,
      msg,
      hotBookingDetailKeyboard(aptId, true)
    );
    return;
  }

  if (data.startsWith("hot:cl:")) {
    const callId = data.slice(7);
    const result = await markCallAsCalled(callId);
    const freshDb = (await loadCrmFromCloud()) ?? db;
    const detail = formatHotCallDetail(freshDb, callId);
    if (!result.ok || !detail) {
      await replyOrEdit(chatId, messageId, BOT.saveFailed, mainMenuKeyboard());
      return;
    }
    await replyOrEdit(
      chatId,
      messageId,
      `${BOT.saved}\n\n${detail}`,
      hotCallDetailKeyboard(callId)
    );
    return;
  }

  if (data.startsWith("hot:")) {
    const page = Number(data.slice(4)) || 0;
    const rows = getWebsiteHotOrders(db, serviceLabel);
    const { text } = formatHotOrders(rows, page);
    await replyOrEdit(chatId, messageId, text, hotOrdersListKeyboard(rows, page));
    return;
  }

  if (data.startsWith("unpaid:")) {
    const page = Number(data.slice(7)) || 0;
    const { text, orders } = formatUnpaidList(db, page);
    await replyOrEdit(chatId, messageId, text, unpaidOrdersKeyboard(orders, page));
    return;
  }

  if (data === "an:menu") {
    await replyOrEdit(chatId, messageId, "📈 <b>Аналитика</b>", analyticsKeyboard());
    return;
  }

  if (data === "an:clients") {
    await replyOrEdit(chatId, messageId, formatTopClients(db), analyticsKeyboard());
    return;
  }

  if (data === "an:marketing") {
    await replyOrEdit(chatId, messageId, formatMarketingReport(db), analyticsKeyboard());
    return;
  }

  if (data === "an:compare") {
    await replyOrEdit(chatId, messageId, formatMonthCompare(db), analyticsKeyboard());
    return;
  }

  if (data.startsWith("apt:")) {
    const page = Number(data.slice(4)) || 0;
    const { text, totalPages } = formatAppointments(db, page);
    const nav = [];
    if (page > 0) nav.push({ text: "◀️", callback_data: `apt:${page - 1}` });
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `apt:${page + 1}` });
    await replyOrEdit(chatId, messageId, text, {
      inline_keyboard: [nav, backMenuRow()],
    });
    return;
  }

  if (data === "mech:menu") {
    await replyOrEdit(chatId, messageId, BOT.choosePeriod, mechanicPeriodKeyboard());
    return;
  }

  if (data.startsWith("mech:")) {
    const period = data.slice(5) as ReportPeriod;
    const report = formatMechanicsReport(db, period);
    await replyOrEdit(chatId, messageId, report, mechanicPeriodKeyboard());
    return;
  }

  if (data === "exp:menu") {
    await replyOrEdit(chatId, messageId, "💸 <b>Расходы сервиса</b>", expenseMenuKeyboard());
    return;
  }

  if (data === "exp:list") {
    await replyOrEdit(chatId, messageId, formatExpensesList(db), expenseMenuKeyboard());
    return;
  }

  if (data === "exp:add") {
    await replyOrEdit(chatId, messageId, BOT.chooseCategory, expenseCategoryKeyboard());
    return;
  }

  if (data.startsWith("exp:cat:")) {
    const category = data.slice(8) as ExpenseCategory;
    await setTelegramSession(chatKey, { step: "expense_input", data: { category } });
    await replyOrEdit(chatId, messageId, BOT.expensePrompt, {
      inline_keyboard: [[{ text: "❌ Отмена", callback_data: "exp:menu" }]],
    });
    return;
  }

  if (data === "wh:0") {
    await replyOrEdit(chatId, messageId, formatWarehouseDetailed(db), warehouseKeyboard());
    return;
  }

  if (data === "wh:low") {
    await replyOrEdit(chatId, messageId, formatWarehouseLowOnly(db), warehouseKeyboard());
    return;
  }

  console.warn("[telegram admin] unhandled callback:", data);
  await replyOrEdit(
    chatId,
    messageId,
    `⚠️ Кнопка <code>${data.slice(0, 40)}</code> не обработана.\n\nОткройте меню заново.`,
    mainMenuKeyboard()
  );
}
