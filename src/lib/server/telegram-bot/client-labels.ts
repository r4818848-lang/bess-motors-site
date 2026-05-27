export const CLIENT = {
  welcome:
    "🛠 <b>BESS MOTORS</b>\n\nАвтосервис в Варшаве.\nПодключите личный кабинет — и получайте статусы заказов, документы на подпись и записи прямо в Telegram.",
  welcomeLinked: "Ваш кабинет активен.",
  book: "📅 Записаться",
  call: "📞 Заказать звонок",
  myAppointments: "📅 Мои записи",
  myOrders: "📋 Заказ-наряды",
  notifications: "🔔 Уведомления",
  myCars: "🚗 Мои авто",
  addVin: "➕ Добавить VIN",
  activate: "🔐 Подключить кабинет",
  contacts: "📍 Контакты",
  menu: "🏠 Главное меню",
  back: "◀️ Назад",
  chooseService: "Выберите услугу:",
  chooseDate: "Выберите дату визита:",
  chooseTime: "Выберите время:",
  enterName: "✏️ Введите ваше имя:",
  enterPhone: "📱 Введите номер телефона:",
  enterComment: "💬 Опишите проблему или пожелания (или нажмите «Пропустить»):",
  linkIntro:
    "🔐 <b>Подключение личного кабинета</b>\n\n" +
    "Сначала отправьте <b>номер телефона</b> — тот же, что привязан к вашему Telegram.\n\n" +
    "Нажмите кнопку ниже или введите номер вручную (+48...).",
  linkPhoneAccepted: (phone: string) =>
    `✅ Телефон: <b>${phone}</b>\n\n` +
    "Теперь введите <b>госномер</b> автомобиля (например WA12345).\n\n" +
    "Он будет паролем для входа на сайт.\n\n" +
    "<i>Ошиблись с телефоном? Нажмите «Изменить телефон».</i>",
  enterPlate:
    "🚗 Введите <b>госномер</b> автомобиля (например WA12345).\n\n" +
    "Этот номер — пароль для входа на сайт:\n<code>телефон + госномер</code>",
  linkConfirmTitle: "📋 <b>Проверьте данные</b>",
  linkConfirmPhone: "📱 Телефон",
  linkConfirmPlate: "🚗 Госномер",
  linkConfirmHint: "Если всё верно — подтвердите. Если нет — исправьте.",
  linkDataCorrect: "✅ Данные верны",
  linkDataWrong: "❌ Данные неверны",
  linkEditPhone: "📱 Изменить телефон",
  linkEditPlate: "🚗 Изменить госномер",
  linkRestart: "🔄 Начать заново",
  linkWhatToFix: "Что нужно исправить?",
  linkSuccess:
    "✅ <b>Кабинет подключён!</b>\n\n" +
    "Теперь вам будут приходить статусы ремонта, документы на подпись и напоминания о записях.\n\n" +
    "На сайте вход: телефон + госномер → bess-motors.com/cabinet",
  linkPhoneBtn: "📱 Отправить мой номер телефона",
  signIntro:
    "✍️ <b>Подписание заказ-наряда</b>\n\n" +
    "Для доступа к документу подключите кабинет — отправьте телефон и госномер.",
  confirmBooking: "✅ Подтвердить запись",
  confirmCall: "✅ Подтвердить заявку",
  skip: "⏭ Пропустить",
  cancel: "❌ Отмена",
  saved:
    "✅ <b>Заявка принята!</b>\n\nМы свяжемся с вами для подтверждения.\n\n📍 Aleja Krakowska 48/52, Warszawa\n☎️ +48 791 257 229",
  callSaved:
    "✅ <b>Заявка на звонок принята!</b>\n\nМастер перезвонит в рабочее время.\n\n☎️ +48 791 257 229",
  saveFailed: "❌ Не удалось сохранить. Попробуйте позже или позвоните нам.",
  invalidName: "❌ Введите имя (минимум 2 символа).",
  invalidPhone: "❌ Нужен корректный номер (минимум 9 цифр).",
  invalidPlate: "❌ Введите госномер (минимум 2 символа).",
  wrongContact: "❌ Отправьте <b>свой</b> номер через кнопку «Отправить контакт», а не чужой.",
  noAppointments: "Нет предстоящих записей.",
  cabinetHint: "🌐 Полный кабинет: https://www.bess-motors.com/cabinet",
  contactsText:
    "<b>BESS MOTORS</b>\n\n📍 Aleja Krakowska 48/52, 02-284 Warszawa\n☎️ +48 791 257 229\n✉️ bessmotorss@gmail.com\n\n🕐 Pn–Sb 8:00–20:00\n\n🌐 https://www.bess-motors.com",
  vinEnter: "🔎 Введите VIN (17 символов):",
  vinInvalid: "❌ VIN должен содержать ровно 17 символов.",
  vinNotFound: "❌ Не удалось распознать VIN. Проверьте номер и попробуйте ещё раз.",
  vinPlateAsk:
    "🚗 Введите госномер (не обязательно). Если пропустить — будет VIN-XXXXXX.\n\nНапример: WA12345",
  vinConfirmTitle: "Проверить и добавить авто?",
  vinConfirmYes: "✅ Добавить",
  vinConfirmNo: "❌ Отмена",
  vinEditVin: "🔄 Другой VIN",
  vinEditPlate: "✏️ Изменить госномер",
  vinAdded: "✅ Автомобиль добавлен и синхронизирован.",
  vinDuplicate: "⚠️ Этот VIN уже есть в вашем гараже.",
};

export const APPOINTMENT_STATUS_CLIENT: Record<string, string> = {
  scheduled: "Ожидает подтверждения",
  confirmed: "Подтверждена",
  completed: "Завершена",
  cancelled: "Отменена",
};
