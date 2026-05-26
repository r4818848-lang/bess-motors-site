import type { ExpenseCategory, RepairStatus } from "@/lib/store";
import type { ReportPeriod } from "@/lib/crm-analytics";

export const REPAIR_STATUS_RU: Record<RepairStatus, string> = {
  received: "Принят",
  diagnostic: "Диагностика",
  repair: "Ремонт",
  waitingParts: "Ожидание запчастей",
  ready: "Готов",
  delivered: "Выдан",
};

export const EXPENSE_CATEGORY_RU: Record<ExpenseCategory, string> = {
  rent: "Аренда",
  tax: "Налоги",
  purchase: "Закупки",
  tools: "Инструмент",
  utilities: "Коммунальные",
  marketing: "Реклама",
  salary: "Зарплаты",
  other: "Прочее",
};

export const PERIOD_RU: Record<ReportPeriod, string> = {
  day: "За день",
  week: "За неделю",
  month: "За месяц",
  year: "За год",
  "2years": "За 2 года",
  custom: "Свой период",
};

export const BOT = {
  welcome:
    "🛠 <b>BESS MOTORS CRM</b>\n\nВыберите раздел — данные берутся из облачной CRM в реальном времени.",
  unauthorized: "⛔ Доступ запрещён. Этот бот только для администратора сервиса.",
  cloudOff: "☁️ Облако CRM не настроено. Проверьте Supabase на Vercel.",
  cloudError: "❌ Не удалось загрузить данные CRM.",
  saved: "✅ Сохранено в CRM.",
  saveFailed: "❌ Ошибка сохранения.",
  back: "◀️ Назад",
  menu: "🏠 Меню",
  todaySummary: "📈 Сводка за сегодня",
  finance: "📊 Финансы",
  workOrders: "📋 Заказ-наряды",
  hotOrders: "🔥 Горячие заказы",
  appointments: "📅 Записи",
  mechanics: "👷 Механики",
  expenses: "💸 Расходы",
  warehouse: "🏭 Склад",
  choosePeriod: "Выберите период отчёта:",
  chooseCategory: "Выберите категорию расхода:",
  expensePrompt:
    "✏️ Отправьте сообщение в формате:\n<code>450 Описание расхода</code>\n\nИли с датой:\n<code>450 Описание 2026-05-27</code>",
  customFrom: "📅 Введите дату начала периода (ГГГГ-ММ-ДД):",
  customTo: "📅 Введите дату окончания (ГГГГ-ММ-ДД):",
  invalidDate: "❌ Неверный формат даты. Используйте ГГГГ-ММ-ДД.",
  invalidExpense:
    "❌ Неверный формат. Пример: <code>450 Аренда помещения</code> или <code>450 Аренда 2026-05-27</code>",
  noOrders: "Нет заказ-нарядов.",
  noHot: "Нет горячих заказов.",
  noApts: "Нет предстоящих записей.",
  noExpenses: "Расходов пока нет.",
};
