export const CLIENT = {
  welcome:
    "🛠 <b>BESS MOTORS</b>\n\nАвтосервис в Варшаве.\nЗапишитесь на ремонт или закажите обратный звонок — прямо здесь, без регистрации.",
  book: "📅 Записаться",
  call: "📞 Заказать звонок",
  myAppointments: "📋 Мои записи",
  contacts: "📍 Контакты",
  menu: "🏠 Главное меню",
  back: "◀️ Назад",
  chooseService: "Выберите услугу:",
  chooseDate: "Выберите дату визита:",
  chooseTime: "Выберите время:",
  enterName: "✏️ Введите ваше имя:",
  enterPhone: "📱 Введите номер телефона:",
  enterComment: "💬 Опишите проблему или пожелания (или нажмите «Пропустить»):",
  enterPhoneForMy: "📱 Введите телефон, который указывали при записи:",
  confirmBooking: "✅ Подтвердить запись",
  confirmCall: "✅ Подтвердить заявку",
  skip: "⏭ Пропустить",
  cancel: "❌ Отмена",
  saved:
    "✅ <b>Заявка принята!</b>\n\nМы свяжемся с вами для подтверждения.\n\n📍 Aleja Krakowska 48/52, Warszawa\n☎️ +48 791 257 229",
  callSaved:
    "✅ <b>Заявка на звонок принята!</b>\n\nМастер перезвонит в рабочее время.\n\n☎️ +48 791 257 229",
  saveFailed: "❌ Не удалось сохранить заявку. Попробуйте позже или позвоните нам.",
  invalidName: "❌ Введите имя (минимум 2 символа).",
  invalidPhone: "❌ Введите корректный номер телефона (минимум 9 цифр).",
  noAppointments: "У вас нет предстоящих записей на этот номер.",
  cabinetHint:
    "Личный кабинет с историей ремонтов:\nhttps://www.bess-motors.com/cabinet",
  contactsText:
    "<b>BESS MOTORS</b>\n\n📍 Aleja Krakowska 48/52, 02-284 Warszawa\n☎️ +48 791 257 229\n✉️ bessmotorss@gmail.com\n\n🕐 Pn–Sb 8:00–20:00\n\n🌐 https://www.bess-motors.com",
};

export const APPOINTMENT_STATUS_CLIENT: Record<string, string> = {
  scheduled: "Ожидает подтверждения",
  confirmed: "Подтверждена",
  completed: "Завершена",
  cancelled: "Отменена",
};
