import type { ExpenseCategory, RepairStatus } from "@/lib/store";
import type { ReportPeriod } from "@/lib/crm-analytics";
import { formatDisplayDateExample, formatDisplayDateKey } from "@/lib/display-date";

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
  monthlyParts: "📦 Запчасти (месяц)",
  monthlyConsumables: "🧴 Расходники (месяц)",
  search: "🔍 Поиск",
  unsigned: "✍️ Подписи",
  calls: "📞 Звонки",
  quickApt: "➕ Запись",
  quickWo: "📋 Быстрый заказ",
  importWo: "📄 Импорт PDF/фото",
  mechLoad: "🔧 Загрузка цеха",
  extraWork: "➕ Доп. работы",
  customMsg: "✉️ Свой текст",
  notifyClient: "📨 Клиенту",
  unpaid: "⏳ Долги",
  analytics: "📈 Аналитика",
  help: "ℹ️ Помощь",
  choosePeriod: "Выберите период отчёта:",
  chooseCategory: "Выберите категорию расхода:",
  expensePrompt: (today = formatDisplayDateExample()) =>
    `✏️ Отправьте сообщение в формате:\n<code>450 Описание расхода</code>\n\nИли с датой:\n<code>450 Описание ${today}</code>`,
  customFrom: `📅 Введите дату начала периода (ДД.ММ.ГГГГ), например <code>${formatDisplayDateExample()}</code>:`,
  customTo: `📅 Введите дату окончания (ДД.ММ.ГГГГ), например <code>${formatDisplayDateExample()}</code>:`,
  invalidDate: "❌ Неверный формат даты. Используйте ДД.ММ.ГГГГ, например 21.06.2026.",
  invalidExpense: (today = formatDisplayDateExample()) =>
    `❌ Неверный формат. Пример: <code>450 Аренда помещения</code> или <code>450 Аренда ${today}</code>`,
  noOrders: "Нет заказ-нарядов.",
  noHot: "Нет горячих заказов.",
  noApts: "Нет предстоящих записей.",
  noExpenses: "Расходов пока нет.",
  searchPrompt: "🔍 Введите госномер, телефон, имя клиента или номер заказ-наряда:",
  searchEmpty: "Ничего не найдено.",
  confirmStatus: "✅ Подтвердить статус",
  cancel: "❌ Отмена",
  changeStatus: "🔄 Сменить статус",
  markPaid: "💳 Отметить оплаченным",
  markUnpaid: "⏳ Сделать неоплаченным",
  confirmBooking: "✅ Подтвердить запись",
  markCalled: "📞 Позвонил",
  statusChanged: "Статус обновлён.",
  helpText:
    "<b>Команды:</b>\n/start — меню\n/find WA12345 — поиск\n\n<b>Быстрый заказ:</b> «📋 Быстрый заказ» → пошагово имя, телефон, авто → сохранение в CRM.\n\n<b>Запчасти:</b> «📦 Запчасти» — название, номер, закуп и продажа <b>брутто</b> (нетто считается сам). <b>Расходники:</b> «🧴 Расходники» — только закуп брутто. Таблица + удаление.\n\n<b>Импорт:</b> «📄 Импорт PDF/фото» → отправьте PDF или скрин Motowarsztat → подтвердите.\n\n<b>Расходы:</b> «💸 Расходы» → «Показать полный список» — все расходы целиком. Добавить: категория → <code>450 Описание</code>\n\n<b>Механик:</b> <code>/linkmech +48… пароль</code> — привязка Telegram к CRM",
  quickWoIntro:
    "📋 <b>Быстрый заказ-наряд</b>\n\nПошагово: имя, фамилия, телефон, авто, работы.\nНа любом шаге можно нажать «Пропустить».",
  quickWoPhoneRequired: "❌ Для сохранения нужен телефон. Введите номер или вернитесь назад.",
  quickAptPrompt: (today = formatDisplayDateExample()) =>
    `➕ <b>Быстрая запись</b>\n\nОтправьте одной строкой:\n<code>+48123456789 ${today} 10:00 комментарий</code>`,
  importPrompt:
    "📄 <b>Импорт заказ-наряда</b>\n\nЛучше <b>PDF</b> из программы (текст читается точнее).\nФото: отправьте <b>как файл (документ)</b>, не сжатое «фото» — иначе OCR ошибается.\nЧитаются клиент, авто, работы и запчасти.",
  importParsing: "⏳ Читаю документ… (до 1 минуты)",
  importNoText:
    "❌ Текст не найден. Попробуйте PDF или чёткое фото как <b>документ</b> (без сжатия Telegram).",
  importOcrPoor:
    "❌ Фото нечитаемо для OCR (размытие/сжатие).\n\n✅ Сделайте: PDF из CRM/программы, или скрин/фото <b>как файл</b>, экран ровно, без бликов.\nМожно ввести заказ вручную в CRM.",
  importBadFile: "❌ Отправьте PDF или изображение (фото/скрин).",
  importDownloadFailed: "❌ Не удалось скачать файл из Telegram.",
  importConfirm: "✅ Создать заказ-наряд",
  importEditPhone: "📱 Изменить телефон",
  importPhonePrompt: "📱 Введите телефон клиента (например <code>+48791257229</code>):",
  importPhoneInvalid: "❌ Неверный телефон. Пример: <code>+48123456789</code>",
  partsInvalid:
    "❌ Неверная цена. Введите число, например <code>22</code> или <code>45,90</code>",
  extraWorkPrompt:
    "➕ <b>Доп. работы</b> для <b>{number}</b>\n\nКаждая строка:\n<code>Название;цена</code> или <code>Название 200</code>\nПервая строка — комментарий клиенту.",
  customMsgPrompt:
    "✉️ <b>Сообщение клиенту</b> (заказ <b>{number}</b>):\n\nВведите текст — уйдёт в Telegram.",
};
