/** Client Telegram bot — UI strings (PL / RU / UK / EN) */

export type BotLocale = "pl" | "ru" | "uk" | "en";

export const BOT_LOCALES: BotLocale[] = ["pl", "ru", "uk", "en"];

export function isBotLocale(v: string): v is BotLocale {
  return BOT_LOCALES.includes(v as BotLocale);
}

export type ClientBotLabels = {
  startBtn: string;
  startKeyboardHint: string;
  chooseLanguage: string;
  languageSaved: (name: string) => string;
  welcome: string;
  welcomeLinked: string;
  linkedWelcome: (name: string) => string;
  book: string;
  call: string;
  myAppointments: string;
  myOrders: string;
  notifications: string;
  myCars: string;
  fleetFinance: string;
  fleetReportTitle: string;
  fleetReportEmpty: string;
  fleetTotalAll: (amount: string) => string;
  fleetTotalPaid: (amount: string) => string;
  fleetTotalUnpaid: (amount: string) => string;
  fleetOrderStats: (paidCount: number, unpaidCount: number) => string;
  fleetByVehicle: string;
  fleetNoUnpaid: string;
  fleetUnpaidList: string;
  fleetMoreOrders: (n: number) => string;
  fleetCarDetailTitle: (plate: string) => string;
  fleetCarNoDebt: string;
  carDebtLine: (amount: string, count: number) => string;
  carAllPaid: string;
  carsTotalDebt: (amount: string) => string;
  fleetNotAvailable: string;
  fleetUnpaidSection: string;
  fleetPaidSection: string;
  fleetIdleSection: string;
  carNoOrders: string;
  fleetCarsHint: string;
  addVin: string;
  activate: string;
  contacts: string;
  menu: string;
  back: string;
  site: string;
  cabinetSite: string;
  chooseService: string;
  chooseDate: string;
  chooseTime: string;
  enterName: string;
  enterPhone: string;
  enterComment: string;
  linkIntro: string;
  linkPhoneAccepted: (phone: string) => string;
  enterPlate: string;
  linkConfirmTitle: string;
  linkConfirmPhone: string;
  linkConfirmPlate: string;
  linkConfirmHint: string;
  linkDataCorrect: string;
  linkDataWrong: string;
  linkEditPhone: string;
  linkEditPlate: string;
  linkRestart: string;
  linkWhatToFix: string;
  linkSuccess: string;
  linkPhoneBtn: string;
  signIntro: string;
  confirmBooking: string;
  confirmCall: string;
  skip: string;
  cancel: string;
  saved: string;
  callSaved: string;
  saveFailed: string;
  cloudUnavailable: string;
  linkInvalidCredentials: string;
  invalidName: string;
  invalidPhone: string;
  invalidPlate: string;
  wrongContact: string;
  noAppointments: string;
  cabinetHint: string;
  contactsText: string;
  vinEnter: string;
  vinInvalid: string;
  vinNotFound: string;
  vinPlateAsk: string;
  vinConfirmTitle: string;
  vinConfirmYes: string;
  vinConfirmNo: string;
  vinEditVin: string;
  vinEditPlate: string;
  vinAdded: string;
  vinDuplicate: string;
  confirmSummaryTitle: string;
  bookOnSite: string;
  signOnSite: string;
  backToList: string;
  appointmentStatus: Record<string, string>;
  ordersEmpty: string;
  ordersTitle: (page: number, total: number) => string;
  orderNotFound: string;
  changeLanguage: string;
  myStatus: string;
  rebook: string;
  galleryPhotos: string;
  referralShare: string;
  quietHours: string;
  quietHoursOn: string;
  quietHoursOff: string;
  referralText: (link: string) => string;
  sendPhoto: string;
  serviceHistory: string;
  rebookWeek: string;
  photoSaved: (number: string) => string;
  photoFailed: string;
  notificationsTitle: string;
  notificationsEmpty: string;
  notifCarReady: string;
  notifSignRequired: string;
  notifAppointment: string;
  notifDefault: string;
  notifStatusUpdated: string;
  appointmentsTitle: string;
  appointmentsEmpty: string;
  carsTitle: string;
  carsEmpty: string;
  paid: string;
  unpaid: string;
  needsSignBadge: string;
  orderStatus: string;
  signed: string;
  needsSignature: string;
  works: string;
  smartBookHint: string;
  symptomQuiz: string;
  symptomIntro: string;
  symptomDone: string;
  symptomPickOne: string;
  concierge: string;
  notifySettings: string;
  notifySettingsIntro: string;
  muteWeekOn: string;
  muteWeekOff: string;
  shareApt: string;
  postFollowupTitle: string;
  postFollowupOk: string;
  postFollowupIssue: string;
  extraWorkTitle: string;
  extraWorkPrompt: string;
  extraApprove: string;
  extraReject: string;
  promoTitle: string;
  promoEmpty: string;
  packagesBtn: string;
  locationBtn: string;
  warrantyBtn: string;
  vehiclePick: string;
  priceListBtn: string;
  promoBtn: string;
  emergencyBtn: string;
  contactCardBtn: string;
  favoritesBtn: string;
  etaBtn: string;
  shareBtn: string;
  repeatBtn: string;
  plusOneDay: string;
  plusSevenDays: string;
  photoUploadHint: string;
  bookingDraftTitle: string;
  confirmAboveHint: string;
  feedbackThanks: string;
  favoritesPick: string;
  noActiveWorkOrders: string;
  noHistory: string;
  serviceHistoryTitle: string;
  noWarranty: string;
  warrantyTitle: string;
  singleVehicleHint: string;
  estimateTitle: string;
  estimateRange: (min: number, max: number) => string;
  priceFromPrefix: string;
  yourCar: string;
  workSection: string;
  conciergeEmpty: string;
  priceListTitle: string;
  priceListFooter: string;
  referralNoData: string;
  referralHead: string;
  referralEmpty: string;
  referralNewJoin: (name: string) => string;
  repeatComment: (services: string) => string;
  queueLine: (pos: number, total: number) => string;
  rebookWeekTitle: string;
  rebookAgainTitle: string;
  galleryTitle: string;
  rebookDateHint: string;
  symptomPickHint: string;
  noActiveOrderForPhoto: string;
  photoAttachHint: string;
  aptMoved: (days: number, date: string, time: string) => string;
  conciergeIntro: string;
  waitingPartsHint: string;
  readyHint: string;
  filesOnOrder: (count: number) => string;
  shareAptTitle: string;
  referralHeadCount: (qualified: number, required: number) => string;
  referralDiscountActive: string;
  postFollowupThanks: string;
  callRequestSent: string;
  repairStatus: Record<string, string>;
};

const LABELS: Record<BotLocale, ClientBotLabels> = {
  pl: {
    startBtn: "🏠 Start",
    startKeyboardHint: "Użyj przycisku <b>Start</b> poniżej, aby wrócić do menu.",
    chooseLanguage: "🌐 <b>Wybierz język / Choose language</b>\n\nWybierz język obsługi w bocie:",
    languageSaved: (name) => `✅ Język: <b>${name}</b>`,
    welcome:
      "🛠 <b>BESS MOTORS</b> — serwis Warszawa\n\n📅 Umów wizytę · 📞 oddzwonienie · 🔐 konto klienta",
    welcomeLinked: "Konto aktywne.",
    linkedWelcome: (name) =>
      `👋 <b>Witaj, ${name}!</b>\n\n📋 Zlecenia · 📅 Wizyty · 🔔 Powiadomienia`,
    book: "📅 Umów wizytę",
    call: "📞 Zamów telefon",
    myAppointments: "📅 Moje wizyty",
    myOrders: "📋 Zlecenia",
    notifications: "🔔 Powiadomienia",
    myCars: "🚗 Moje auta",
    fleetFinance: "💳 Rozliczenia",
    fleetReportTitle: "💳 <b>Raport finansowy — Twoje auta</b>",
    fleetReportEmpty:
      "💳 <b>Rozliczenia</b>\n\nBrak zleceń. Po pierwszej wizycie zobaczysz tu kwoty i status płatności.",
    fleetTotalAll: (a) => `📊 Razem usług: <b>${a}</b>`,
    fleetTotalPaid: (a) => `✅ Opłacone: <b>${a}</b>`,
    fleetTotalUnpaid: (a) => `⏳ Do zapłaty: <b>${a}</b>`,
    fleetOrderStats: (paid, unpaid) =>
      `Zlecenia: ${paid} opł. · ${unpaid} nieopł.`,
    fleetByVehicle: "<b>Według pojazdu:</b>",
    fleetNoUnpaid: "✅ Brak zaległości — dziękujemy!",
    fleetUnpaidList: "Nieopłacone zlecenia",
    fleetMoreOrders: (n) => `… i jeszcze ${n} zleceń`,
    fleetCarDetailTitle: (plate) => `🚗 <b>${plate}</b>`,
    fleetCarNoDebt: "✅ Wszystkie zlecenia tego auta są opłacone.",
    carDebtLine: (a, n) => `⏳ Do zapłaty: <b>${a}</b> (${n} zlec.)`,
    carAllPaid: "✅ Opłacone",
    carsTotalDebt: (a) => `\n<b>Łącznie do zapłaty: ${a}</b>`,
    fleetNotAvailable: "Ta sekcja jest dostępna tylko dla klientów flotowych. Skontaktuj się z warsztatem.",
    fleetUnpaidSection: "⏳ Do zapłaty",
    fleetPaidSection: "✅ Opłacone",
    fleetIdleSection: "🚗 Bez zleceń w systemie",
    carNoOrders: "Brak zleceń",
    fleetCarsHint: "💡 Pełny raport: przycisk «Rozliczenia» w menu.",
    addVin: "➕ Dodaj VIN",
    activate: "🔐 Połącz konto",
    contacts: "📍 Kontakt",
    menu: "🏠 Menu główne",
    back: "◀️ Wstecz",
    site: "🌐 Strona",
    cabinetSite: "🌐 Konto na stronie",
    chooseService: "Wybierz usługę:",
    chooseDate: "Wybierz datę wizyty:",
    chooseTime: "Wybierz godzinę:",
    enterName: "✏️ Podaj imię i nazwisko:",
    enterPhone: "📱 Podaj numer telefonu:",
    enterComment: "💬 Opisz problem (lub «Pomiń»):",
    linkIntro:
      "🔐 <b>Połączenie konta</b>\n\nWyślij <b>numer telefonu</b> powiązany z Telegramem.\n\nPrzycisk poniżej lub wpisz ręcznie (+48...).",
    linkPhoneAccepted: (phone) =>
      `✅ Telefon: <b>${phone}</b>\n\nTeraz wpisz <b>numer rejestracyjny</b> (np. WA12345).\n\nTo hasło do logowania na stronie.\n\n<i>Błąd? «Zmień telefon».</i>`,
    enterPlate:
      "🚗 Wpisz <b>numer rejestracyjny</b> (np. WA12345).\n\nHasło do strony:\n<code>telefon + tablica</code>",
    linkConfirmTitle: "📋 <b>Sprawdź dane</b>",
    linkConfirmPhone: "📱 Telefon",
    linkConfirmPlate: "🚗 Tablica",
    linkConfirmHint: "Jeśli OK — potwierdź. Jeśli nie — popraw.",
    linkDataCorrect: "✅ Dane poprawne",
    linkDataWrong: "❌ Dane niepoprawne",
    linkEditPhone: "📱 Zmień telefon",
    linkEditPlate: "🚗 Zmień tablicę",
    linkRestart: "🔄 Od nowa",
    linkWhatToFix: "Co poprawić?",
    linkSuccess:
      "✅ <b>Konto połączone!</b>\n\nStatusy napraw, podpisy i przypomnienia — w Telegramie.\n\nStrona: telefon + tablica → bess-motors.com/cabinet",
    linkPhoneBtn: "📱 Wyślij mój numer",
    signIntro: "✍️ <b>Podpis zlecenia</b>\n\nPołącz konto — telefon i tablica rejestracyjna.",
    confirmBooking: "✅ Potwierdź wizytę",
    confirmCall: "✅ Potwierdź prośbę",
    skip: "⏭ Pomiń",
    cancel: "❌ Anuluj",
    saved:
      "✅ <b>Przyjęto!</b>\n\nSkontaktujemy się w celu potwierdzenia.\n\n📍 Aleja Krakowska 48/52, Warszawa\n☎️ +48 791 257 229",
    callSaved:
      "✅ <b>Prośba o telefon przyjęta!</b>\n\nOddzwonimy w godzinach pracy.\n\n☎️ +48 791 257 229",
    saveFailed: "❌ Nie udało się zapisać. Spróbuj później lub zadzwoń.",
    cloudUnavailable:
      "☁️ Baza CRM chwilowo niedostępna. Spróbuj za chwilę lub zadzwoń: +48 791 257 229",
    linkInvalidCredentials:
      "❌ Nie znaleziono konta. Sprawdź telefon i tablicę (jak w kabinecie na stronie).",
    invalidName: "❌ Podaj imię (min. 2 znaki).",
    invalidPhone: "❌ Podaj poprawny numer (min. 9 cyfr).",
    invalidPlate: "❌ Podaj numer rejestracyjny (min. 2 znaki).",
    wrongContact: "❌ Wyślij <b>swój</b> numer przyciskiem «Wyślij numer», nie cudzy.",
    noAppointments: "Brak nadchodzących wizyt.",
    cabinetHint: "🌐 Pełne konto: https://www.bess-motors.com/cabinet",
    contactsText:
      "<b>BESS MOTORS</b>\n\n📍 Aleja Krakowska 48/52, 02-284 Warszawa\n☎️ +48 791 257 229\n✉️ bessmotorss@gmail.com\n\n🕐 Pn–Sb 8:00–18:00\n\n🌐 https://www.bess-motors.com",
    vinEnter: "🔎 Wpisz VIN (17 znaków):",
    vinInvalid: "❌ VIN musi mieć dokładnie 17 znaków.",
    vinNotFound: "❌ Nie rozpoznano VIN. Sprawdź i spróbuj ponownie.",
    vinPlateAsk: "🚗 Tablica (opcjonalnie). Pomiń → VIN-XXXXXX.\n\nNp. WA12345",
    vinConfirmTitle: "Dodać auto?",
    vinConfirmYes: "✅ Dodaj",
    vinConfirmNo: "❌ Anuluj",
    vinEditVin: "🔄 Inny VIN",
    vinEditPlate: "✏️ Zmień tablicę",
    vinAdded: "✅ Auto dodane i zsynchronizowane.",
    vinDuplicate: "⚠️ Ten VIN jest już w garażu.",
    confirmSummaryTitle: "<b>Sprawdź dane:</b>",
    bookOnSite: "🌐 Rezerwacja online",
    signOnSite: "✍️ Podpis na stronie",
    backToList: "◀️ Do listy",
    appointmentStatus: {
      scheduled: "Oczekuje potwierdzenia",
      confirmed: "Potwierdzona",
      completed: "Zakończona",
      cancelled: "Anulowana",
    },
    ordersEmpty: "📋 <b>Zlecenia</b>\n\nBrak zleceń.",
    ordersTitle: (p, t) => `📋 <b>Zlecenia</b> (${p}/${t})`,
    orderNotFound: "Nie znaleziono zlecenia.",
    changeLanguage: "🌐 Język",
    myStatus: "📊 Status",
    rebook: "🔁 Ponów wizytę",
    galleryPhotos: "🖼 Galeria",
    referralShare: "🎁 Polec znajomego",
    quietHours: "🌙 Cisza nocna",
    quietHoursOn: "✅ Cisza nocna włączona (22–8)",
    quietHoursOff: "🔔 Powiadomienia o każdej porze",
    referralText: (link) =>
      `🎁 <b>Poleć BESS MOTORS</b>\n\nWyślij link znajomemu:\n${link}`,
    sendPhoto: "📷 Wyślij zdjęcie",
    serviceHistory: "📜 Historia",
    rebookWeek: "📅 Za 7 dni",
    photoSaved: (n) => `✅ Zdjęcie zapisane (${n})`,
    photoFailed: "❌ Nie udało się zapisać zdjęcia.",
    notificationsTitle: "🔔 <b>Powiadomienia</b>",
    notificationsEmpty: "🔔 <b>Powiadomienia</b>\n\nBrak nowych.",
    notifCarReady: "Auto gotowe",
    notifSignRequired: "Wymagany podpis",
    notifAppointment: "Wizyta",
    notifDefault: "Powiadomienie",
    notifStatusUpdated: "zaktualizowany",
    appointmentsTitle: "📅 <b>Nadchodzące wizyty</b>",
    appointmentsEmpty: "📅 <b>Wizyty</b>\n\nBrak nadchodzących.",
    carsTitle: "🚗 <b>Moje auta</b>",
    carsEmpty: "🚗 <b>Moje auta</b>\n\nPojawią się po pierwszej wizycie.",
    paid: "opłacone",
    unpaid: "nieopłacone",
    needsSignBadge: " · ✍️ podpis",
    orderStatus: "Status",
    signed: "Podpisane",
    needsSignature: "✍️ <b>Wymagany podpis</b>",
    works: "Prace",
    smartBookHint: "💡 Napisz np.: <i>jutro 17:30 wymiana oleju</i>",
    symptomQuiz: "🔍 Objawy / wycena",
    symptomIntro: "🔍 <b>Co się dzieje z autem?</b>\n\nZaznacz objawy (wiele OK), potem «Gotowe».",
    symptomDone: "✅ Gotowe",
    symptomPickOne: "Wybierz co najmniej jeden objaw.",
    concierge: "🤖 Asystent",
    notifySettings: "🔕 Powiadomienia",
    notifySettingsIntro:
      "🔕 <b>Ustawienia powiadomień</b>\n\nWybierz kategorie. «Wycisz 7 dni» — bez marketingu i przypomnień (podpis nadal możliwy).",
    muteWeekOn: "🔇 Wycisz na 7 dni",
    muteWeekOff: "🔔 Włącz powiadomienia",
    shareApt: "📤 Udostępnij wizytę",
    postFollowupTitle: "Kontrola po serwisie",
    postFollowupOk: "✅ Wszystko OK",
    postFollowupIssue: "⚠️ Jest pytanie",
    extraWorkTitle: "➕ <b>Dodatkowe prace</b>",
    extraWorkPrompt: "Zatwierdzić pozycje w kosztorysie?",
    extraApprove: "✅ Zgadzam się",
    extraReject: "❌ Odmawiam",
    promoTitle: "🏷 <b>Promocje</b>",
    promoEmpty: "Brak aktywnych kodów — sprawdź stronę.",
    packagesBtn: "📦 Pakiety usług",
    locationBtn: "📍 Dojazd",
    warrantyBtn: "🛡 Gwarancja",
    vehiclePick: "🚗 Wybierz auto",
    priceListBtn: "💰 Cennik",
    promoBtn: "🏷 Promocje",
    emergencyBtn: "🆘 Awaria",
    contactCardBtn: "📇 Kontakt",
    favoritesBtn: "⭐ Ulubione",
    etaBtn: "⏱ Termin",
    shareBtn: "📤 Udostępnij",
    repeatBtn: "🔁 Powtórz",
    plusOneDay: "+1 dzień",
    plusSevenDays: "+7 dni",
    photoUploadHint: "📷 Aby wysłać zdjęcie do zlecenia — użyj «Wyślij zdjęcie» w menu.",
    bookingDraftTitle: "📝 <b>Rozpoznano zapisy:</b>",
    confirmAboveHint: "👆 Potwierdź wizytę przyciskiem powyżej lub wpisz /menu, aby anulować.",
    feedbackThanks: "Dziękujemy za opinię!",
    favoritesPick: "⭐ Wybierz ulubioną usługę:",
    noActiveWorkOrders: "📋 Brak aktywnych zleceń.",
    noHistory: "📜 Brak historii.",
    serviceHistoryTitle: "📜 <b>Historia serwisu</b>",
    noWarranty: "🛡 Brak aktywnej gwarancji.",
    warrantyTitle: "🛡 <b>Gwarancja</b>",
    singleVehicleHint: "🚗 Masz jedno auto w profilu.",
    estimateTitle: "💡 <b>Szacunek (orientacyjny)</b>",
    estimateRange: (min, max) => `Razem: ok. <b>${min}–${max}</b> zł`,
    priceFromPrefix: "od ",
    yourCar: "Twój samochód",
    workSection: "Wykonane / plan:",
    conciergeEmpty: "Brak aktywnego zlecenia.",
    priceListTitle: "💰 <b>Cennik</b> (od):",
    priceListFooter: "\n\nPełny cennik: bessmotors.pl/cennik",
    referralNoData: "Brak danych.",
    referralHead: "🎁 <b>Program poleceń</b>",
    referralEmpty: "Brak poleconych.",
    referralNewJoin: (name) => `🎁 <b>Nowy polecony klient</b>\n${name} dołączył przez Twój link.`,
    repeatComment: (services) => `Powtórz: ${services}`,
    queueLine: (pos, total) => `📊 Kolejka: ok. <b>${pos}</b> z <b>${total}</b>`,
    rebookWeekTitle: "📅 <b>Ta sama wizyta za 7 dni</b>",
    rebookAgainTitle: "🔁 <b>Ponowna rezerwacja</b>",
    galleryTitle: "🖼 <b>Zdjęcia napraw</b>",
    rebookDateHint: "Wybierz datę w menu «Umów wizytę» lub napisz — pomożemy.",
    symptomPickHint: "👆 Wybierz objawy przyciskami powyżej.",
    noActiveOrderForPhoto: "📷 Brak aktywnego zlecenia — nie można dodać zdjęcia.",
    photoAttachHint: "📷 Wyślij zdjęcie — zapiszemy do aktywnego zlecenia.",
    aptMoved: (days, date, time) => `✅ Przeniesiono o ${days} dni: ${date} ${time}`,
    conciergeIntro: "🤖 <b>Asystent</b>\n\nBrak aktywnego zlecenia. Umów wizytę lub sprawdź historię.",
    waitingPartsHint: "⏳ <b>Czekamy na części</b> — damy znać, gdy dotrą.",
    readyHint: "✅ Auto gotowe do odbioru!",
    filesOnOrder: (count) => `📎 Pliki w zleceniu: <b>${count}</b>`,
    shareAptTitle: "📤 <b>Wizyta BESS MOTORS</b>",
    referralHeadCount: (q, r) => `🎁 <b>Polecenia:</b> ${q}/${r}`,
    referralDiscountActive: "\n\n🎉 Zniżka 15% aktywna!",
    postFollowupThanks: "✅ Dziękujemy! Jeśli coś się zmieni — napisz lub zamów telefon.",
    callRequestSent: "📞 Prośba o kontakt wysłana — oddzwonimy.",
    repairStatus: {
      received: "Przyjęty",
      diagnostic: "Diagnostyka",
      repair: "Naprawa",
      waitingParts: "Czeka na części",
      ready: "Gotowy",
      delivered: "Wydany",
    },
  },
  ru: {
    startBtn: "🏠 Старт",
    startKeyboardHint: "Нажмите <b>Старт</b> внизу экрана, чтобы открыть главное меню.",
    chooseLanguage: "🌐 <b>Выберите язык</b>\n\nНа каком языке вести диалог?",
    languageSaved: (name) => `✅ Язык: <b>${name}</b>`,
    welcome:
      "🛠 <b>BESS MOTORS</b> — сервис Warszawa\n\n📅 Запись · 📞 Звонок · 🔐 Личный кабинет",
    welcomeLinked: "Кабинет подключён.",
    linkedWelcome: (name) =>
      `👋 <b>Здравствуйте, ${name}!</b>\n\n📋 Заказ-наряды · 📅 Записи · 🔔 Уведомления`,
    book: "📅 Записаться",
    call: "📞 Заказать звонок",
    myAppointments: "📅 Мои записи",
    myOrders: "📋 Заказ-наряды",
    notifications: "🔔 Уведомления",
    myCars: "🚗 Мои авто",
    fleetFinance: "💳 Оплаты",
    fleetReportTitle: "💳 <b>Финансовый отчёт — ваши автомобили</b>",
    fleetReportEmpty:
      "💳 <b>Оплаты</b>\n\nЗаказов пока нет. После визита здесь будут суммы и статус оплаты.",
    fleetTotalAll: (a) => `📊 Всего услуг: <b>${a}</b>`,
    fleetTotalPaid: (a) => `✅ Оплачено: <b>${a}</b>`,
    fleetTotalUnpaid: (a) => `⏳ К оплате: <b>${a}</b>`,
    fleetOrderStats: (paid, unpaid) =>
      `Заказы: ${paid} опл. · ${unpaid} долг`,
    fleetByVehicle: "<b>По автомобилям:</b>",
    fleetNoUnpaid: "✅ Задолженностей нет — спасибо!",
    fleetUnpaidList: "Неоплаченные заказы",
    fleetMoreOrders: (n) => `… и ещё ${n} заказов`,
    fleetCarDetailTitle: (plate) => `🚗 <b>${plate}</b>`,
    fleetCarNoDebt: "✅ По этому авто всё оплачено.",
    carDebtLine: (a, n) => `⏳ К оплате: <b>${a}</b> (${n} зак.)`,
    carAllPaid: "✅ Оплачено",
    carsTotalDebt: (a) => `\n<b>Итого к оплате: ${a}</b>`,
    fleetNotAvailable:
      "Этот раздел только для клиентов с автопарком. Свяжитесь с сервисом, если вам нужен такой доступ.",
    fleetUnpaidSection: "⏳ К оплате",
    fleetPaidSection: "✅ Оплачено",
    fleetIdleSection: "🚗 Без заказов в системе",
    carNoOrders: "Нет заказов",
    fleetCarsHint: "💡 Полный отчёт — кнопка «Оплаты» в меню.",
    addVin: "➕ Добавить VIN",
    activate: "🔐 Подключить кабинет",
    contacts: "📍 Контакты",
    menu: "🏠 Главное меню",
    back: "◀️ Назад",
    site: "🌐 Сайт",
    cabinetSite: "🌐 Кабинет на сайте",
    chooseService: "Выберите услугу:",
    chooseDate: "Выберите дату визита:",
    chooseTime: "Выберите время:",
    enterName: "✏️ Введите ваше имя:",
    enterPhone: "📱 Введите номер телефона:",
    enterComment: "💬 Опишите проблему (или «Пропустить»):",
    linkIntro:
      "🔐 <b>Подключение личного кабинета</b>\n\nОтправьте <b>номер телефона</b>, привязанный к Telegram.\n\nКнопка ниже или введите вручную (+48...).",
    linkPhoneAccepted: (phone) =>
      `✅ Телефон: <b>${phone}</b>\n\nВведите <b>госномер</b> (например WA12345).\n\nПароль для сайта.\n\n<i>Ошиблись? «Изменить телефон».</i>`,
    enterPlate:
      "🚗 Введите <b>госномер</b> (например WA12345).\n\nПароль для входа:\n<code>телефон + госномер</code>",
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
      "✅ <b>Кабинет подключён!</b>\n\nСтатусы ремонта, подписи и напоминания — в Telegram.\n\nСайт: телефон + госномер → bess-motors.com/cabinet",
    linkPhoneBtn: "📱 Отправить мой номер телефона",
    signIntro:
      "✍️ <b>Подписание заказ-наряда</b>\n\nПодключите кабинет — телефон и госномер.",
    confirmBooking: "✅ Подтвердить запись",
    confirmCall: "✅ Подтвердить заявку",
    skip: "⏭ Пропустить",
    cancel: "❌ Отмена",
    saved:
      "✅ <b>Заявка принята!</b>\n\nМы свяжемся для подтверждения.\n\n📍 Aleja Krakowska 48/52, Warszawa\n☎️ +48 791 257 229",
    callSaved:
      "✅ <b>Заявка на звонок принята!</b>\n\nПерезвоним в рабочее время.\n\n☎️ +48 791 257 229",
    saveFailed: "❌ Не удалось сохранить. Попробуйте позже или позвоните.",
    cloudUnavailable:
      "☁️ База CRM временно недоступна. Попробуйте через минуту или звоните: +48 791 257 229",
    linkInvalidCredentials:
      "❌ Аккаунт не найден. Проверьте телефон и госномер (как в личном кабинете на сайте).",
    invalidName: "❌ Введите имя (минимум 2 символа).",
    invalidPhone: "❌ Нужен корректный номер (минимум 9 цифр).",
    invalidPlate: "❌ Введите госномер (минимум 2 символа).",
    wrongContact: "❌ Отправьте <b>свой</b> номер через кнопку «Отправить контакт».",
    noAppointments: "Нет предстоящих записей.",
    cabinetHint: "🌐 Полный кабинет: https://www.bess-motors.com/cabinet",
    contactsText:
      "<b>BESS MOTORS</b>\n\n📍 Aleja Krakowska 48/52, 02-284 Warszawa\n☎️ +48 791 257 229\n✉️ bessmotorss@gmail.com\n\n🕐 Pn–Sb 8:00–18:00\n\n🌐 https://www.bess-motors.com",
    vinEnter: "🔎 Введите VIN (17 символов):",
    vinInvalid: "❌ VIN должен содержать ровно 17 символов.",
    vinNotFound: "❌ Не удалось распознать VIN.",
    vinPlateAsk: "🚗 Госномер (необязательно). Пропуск → VIN-XXXXXX.\n\nНапример: WA12345",
    vinConfirmTitle: "Добавить автомобиль?",
    vinConfirmYes: "✅ Добавить",
    vinConfirmNo: "❌ Отмена",
    vinEditVin: "🔄 Другой VIN",
    vinEditPlate: "✏️ Изменить госномер",
    vinAdded: "✅ Автомобиль добавлен.",
    vinDuplicate: "⚠️ Этот VIN уже в гараже.",
    confirmSummaryTitle: "<b>Проверьте данные:</b>",
    bookOnSite: "🌐 Запись на сайте",
    signOnSite: "✍️ Подписать на сайте",
    backToList: "◀️ К списку",
    appointmentStatus: {
      scheduled: "Ожидает подтверждения",
      confirmed: "Подтверждена",
      completed: "Завершена",
      cancelled: "Отменена",
    },
    ordersEmpty: "📋 <b>Заказ-наряды</b>\n\nПока нет заказ-нарядов.",
    ordersTitle: (p, t) => `📋 <b>Заказ-наряды</b> (${p}/${t})`,
    orderNotFound: "Заказ-наряд не найден.",
    changeLanguage: "🌐 Язык",
    myStatus: "📊 Статус",
    rebook: "🔁 Записаться снова",
    galleryPhotos: "🖼 Фото работ",
    referralShare: "🎁 Пригласить друга",
    quietHours: "🌙 Тихие часы",
    quietHoursOn: "✅ Тихие часы 22:00–08:00",
    quietHoursOff: "🔔 Уведомления в любое время",
    referralText: (link) =>
      `🎁 <b>Пригласите в BESS MOTORS</b>\n\nСсылка для друга:\n${link}`,
    sendPhoto: "📷 Отправить фото",
    serviceHistory: "📜 История",
    rebookWeek: "📅 Через 7 дней",
    photoSaved: (n) => `✅ Фото сохранено (${n})`,
    photoFailed: "❌ Не удалось сохранить фото.",
    notificationsTitle: "🔔 <b>Уведомления</b>",
    notificationsEmpty: "🔔 <b>Уведомления</b>\n\nНет новых уведомлений.",
    notifCarReady: "Авто готово",
    notifSignRequired: "Нужна подпись",
    notifAppointment: "Запись",
    notifDefault: "Уведомление",
    notifStatusUpdated: "обновлён",
    appointmentsTitle: "📅 <b>Ближайшие записи</b>",
    appointmentsEmpty: "📅 <b>Записи</b>\n\nНет предстоящих записей.",
    carsTitle: "🚗 <b>Мои автомобили</b>",
    carsEmpty: "🚗 <b>Мои авто</b>\n\nАвтомобили появятся после первого визита.",
    paid: "оплачен",
    unpaid: "не оплачен",
    needsSignBadge: " · ✍️ нужна подпись",
    orderStatus: "Статус",
    signed: "✅ Подписан",
    needsSignature: "✍️ <b>Требуется подпись</b>",
    works: "Работы",
    smartBookHint: "💡 Напишите, например: <i>завтра 17:30 замена масла</i>",
    symptomQuiz: "🔍 Симптомы / смета",
    symptomIntro: "🔍 <b>Что беспокоит в авто?</b>\n\nОтметьте симптомы, затем «Готово».",
    symptomDone: "✅ Готово",
    symptomPickOne: "Выберите хотя бы один симптом.",
    concierge: "🤖 Консьерж",
    notifySettings: "🔕 Уведомления",
    notifySettingsIntro:
      "🔕 <b>Настройки уведомлений</b>\n\nКатегории можно отключить. «Тишина 7 дней» — без напоминаний (подпись документов остаётся).",
    muteWeekOn: "🔇 Тишина 7 дней",
    muteWeekOff: "🔔 Включить уведомления",
    shareApt: "📤 Поделиться записью",
    postFollowupTitle: "Контроль после сервиса",
    postFollowupOk: "✅ Всё отлично",
    postFollowupIssue: "⚠️ Есть вопрос",
    extraWorkTitle: "➕ <b>Дополнительные работы</b>",
    extraWorkPrompt: "Согласовать позиции в смете?",
    extraApprove: "✅ Согласен",
    extraReject: "❌ Отказ",
    promoTitle: "🏷 <b>Промокоды</b>",
    promoEmpty: "Нет активных кодов — смотрите сайт.",
    packagesBtn: "📦 Пакеты услуг",
    locationBtn: "📍 Как доехать",
    warrantyBtn: "🛡 Гарантия",
    vehiclePick: "🚗 Выбрать авто",
    priceListBtn: "💰 Цены",
    promoBtn: "🏷 Промокоды",
    emergencyBtn: "🆘 Экстренно",
    contactCardBtn: "📇 Контакт",
    favoritesBtn: "⭐ Избранное",
    etaBtn: "⏱ Срок",
    shareBtn: "📤 Поделиться",
    repeatBtn: "🔁 Повторить",
    plusOneDay: "+1 день",
    plusSevenDays: "+7 дн.",
    photoUploadHint: "📷 Чтобы прикрепить фото к заказу — нажмите «Отправить фото» в меню.",
    bookingDraftTitle: "📝 <b>Распознана запись:</b>",
    confirmAboveHint: "👆 Подтвердите кнопкой выше или /menu для отмены.",
    feedbackThanks: "Спасибо за оценку! 🙏",
    favoritesPick: "⭐ Выберите избранную услугу для быстрой записи:",
    noActiveWorkOrders: "📋 Нет активных заказ-нарядов.",
    noHistory: "📜 Нет истории.",
    serviceHistoryTitle: "📜 <b>История обслуживания</b>",
    noWarranty: "🛡 Нет активной гарантии.",
    warrantyTitle: "🛡 <b>Гарантия</b>",
    singleVehicleHint: "🚗 В профиле одно авто.",
    estimateTitle: "💡 <b>Ориентировочная смета</b>",
    estimateRange: (min, max) => `Итого: ориентир <b>${min}–${max}</b> zł`,
    priceFromPrefix: "от ",
    yourCar: "Ваш автомобиль",
    workSection: "Работы:",
    conciergeEmpty: "Нет активного заказ-наряда.",
    priceListTitle: "💰 <b>Ориентиры цен</b> (от):",
    priceListFooter: "\n\nПолный прайс: bessmotors.pl/cennik",
    referralNoData: "Нет данных.",
    referralHead: "🎁 <b>Реферальная программа</b>",
    referralEmpty: "Пока никого.",
    referralNewJoin: (name) => `🎁 <b>Новый реферал</b>\n${name} перешёл по вашей ссылке.`,
    repeatComment: (services) => `Повтор: ${services}`,
    queueLine: (pos, total) => `📊 Очередь: примерно <b>${pos}</b> из <b>${total}</b>`,
    rebookWeekTitle: "📅 <b>Та же запись через 7 дней</b>",
    rebookAgainTitle: "🔁 <b>Повторная запись</b>",
    galleryTitle: "🖼 <b>Фото работ</b>",
    rebookDateHint: "Выберите дату в меню «Записаться» или напишите нам.",
    symptomPickHint: "👆 Выберите симптомы кнопками выше.",
    noActiveOrderForPhoto: "📷 Нет активного заказ-наряда для фото.",
    photoAttachHint: "📷 Отправьте фото — прикрепим к заказ-наряду.",
    aptMoved: (days, date, time) => `✅ Перенесено на ${days} дн.: ${date} ${time}`,
    conciergeIntro: "🤖 <b>Консьерж</b>\n\nНет активного заказа. Запишитесь или откройте историю.",
    waitingPartsHint: "⏳ <b>Ждём запчасти</b> — сообщим, когда приедут.",
    readyHint: "✅ Авто готово к выдаче!",
    filesOnOrder: (count) => `📎 Файлов в заказе: <b>${count}</b>`,
    shareAptTitle: "📤 <b>Запись BESS MOTORS</b>",
    referralHeadCount: (q, r) => `🎁 <b>Рефералы:</b> ${q}/${r}`,
    referralDiscountActive: "\n\n🎉 Скидка 15% активна!",
    postFollowupThanks: "✅ Спасибо! Если что-то изменится — напишите или закажите звонок.",
    callRequestSent: "📞 Заявка на звонок отправлена — перезвоним.",
    repairStatus: {
      received: "Принят",
      diagnostic: "Диагностика",
      repair: "Ремонт",
      waitingParts: "Ожидание запчастей",
      ready: "Готов",
      delivered: "Выдан",
    },
  },
  uk: {
    startBtn: "🏠 Старт",
    startKeyboardHint: "Натисніть <b>Старт</b> внизу, щоб відкрити головне меню.",
    chooseLanguage: "🌐 <b>Оберіть мову</b>\n\nМовою спілкування в боті:",
    languageSaved: (name) => `✅ Мова: <b>${name}</b>`,
    welcome:
      "🛠 <b>BESS MOTORS</b> — сервіс Warszawa\n\n📅 Запис · 📞 Дзвінок · 🔐 Кабінет",
    welcomeLinked: "Кабінет підключено.",
    linkedWelcome: (name) =>
      `👋 <b>Вітаємо, ${name}!</b>\n\n📋 Замовлення · 📅 Записи · 🔔 Сповіщення`,
    book: "📅 Записатися",
    call: "📞 Замовити дзвінок",
    myAppointments: "📅 Мої записи",
    myOrders: "📋 Замовлення",
    notifications: "🔔 Сповіщення",
    myCars: "🚗 Мої авто",
    fleetFinance: "💳 Оплати",
    fleetReportTitle: "💳 <b>Фінансовий звіт — ваші авто</b>",
    fleetReportEmpty:
      "💳 <b>Оплати</b>\n\nЗамовлень ще немає. Після візиту тут будуть суми та статус оплати.",
    fleetTotalAll: (a) => `📊 Всього послуг: <b>${a}</b>`,
    fleetTotalPaid: (a) => `✅ Сплачено: <b>${a}</b>`,
    fleetTotalUnpaid: (a) => `⏳ До сплати: <b>${a}</b>`,
    fleetOrderStats: (paid, unpaid) =>
      `Замовлення: ${paid} опл. · ${unpaid} борг`,
    fleetByVehicle: "<b>За авто:</b>",
    fleetNoUnpaid: "✅ Боргів немає — дякуємо!",
    fleetUnpaidList: "Неоплачені замовлення",
    fleetMoreOrders: (n) => `… і ще ${n} замовлень`,
    fleetCarDetailTitle: (plate) => `🚗 <b>${plate}</b>`,
    fleetCarNoDebt: "✅ По цьому авто все сплачено.",
    carDebtLine: (a, n) => `⏳ До сплати: <b>${a}</b> (${n} зам.)`,
    carAllPaid: "✅ Сплачено",
    carsTotalDebt: (a) => `\n<b>Разом до сплати: ${a}</b>`,
    fleetNotAvailable:
      "Цей розділ лише для клієнтів з автопарком. Зверніться до сервісу.",
    fleetUnpaidSection: "⏳ До сплати",
    fleetPaidSection: "✅ Сплачено",
    fleetIdleSection: "🚗 Без замовлень у системі",
    carNoOrders: "Немає замовлень",
    fleetCarsHint: "💡 Повний звіт — кнопка «Оплати» в меню.",
    addVin: "➕ Додати VIN",
    activate: "🔐 Підключити кабінет",
    contacts: "📍 Контакти",
    menu: "🏠 Головне меню",
    back: "◀️ Назад",
    site: "🌐 Сайт",
    cabinetSite: "🌐 Кабінет на сайті",
    chooseService: "Оберіть послугу:",
    chooseDate: "Оберіть дату візиту:",
    chooseTime: "Оберіть час:",
    enterName: "✏️ Введіть ім'я:",
    enterPhone: "📱 Введіть номер телефону:",
    enterComment: "💬 Опишіть проблему (або «Пропустити»):",
    linkIntro:
      "🔐 <b>Підключення кабінету</b>\n\nНадішліть <b>номер телефону</b>, прив'язаний до Telegram.\n\nКнопка нижче або +48...",
    linkPhoneAccepted: (phone) =>
      `✅ Телефон: <b>${phone}</b>\n\nВведіть <b>держномер</b> (наприклад WA12345).\n\nПароль для сайту.`,
    enterPlate: "🚗 Введіть <b>держномер</b>.\n\nПароль: <code>телефон + номер</code>",
    linkConfirmTitle: "📋 <b>Перевірте дані</b>",
    linkConfirmPhone: "📱 Телефон",
    linkConfirmPlate: "🚗 Держномер",
    linkConfirmHint: "Якщо все вірно — підтвердіть.",
    linkDataCorrect: "✅ Дані вірні",
    linkDataWrong: "❌ Дані невірні",
    linkEditPhone: "📱 Змінити телефон",
    linkEditPlate: "🚗 Змінити номер",
    linkRestart: "🔄 Спочатку",
    linkWhatToFix: "Що виправити?",
    linkSuccess: "✅ <b>Кабінет підключено!</b>\n\nСтатуси та документи — у Telegram.",
    linkPhoneBtn: "📱 Надіслати мій номер",
    signIntro: "✍️ <b>Підпис замовлення</b>\n\nПідключіть кабінет.",
    confirmBooking: "✅ Підтвердити запис",
    confirmCall: "✅ Підтвердити заявку",
    skip: "⏭ Пропустити",
    cancel: "❌ Скасувати",
    saved: "✅ <b>Прийнято!</b>\n\nМи зв'яжемося для підтвердження.\n\n☎️ +48 791 257 229",
    callSaved: "✅ <b>Заявку на дзвінок прийнято!</b>\n\n☎️ +48 791 257 229",
    saveFailed: "❌ Не вдалося зберегти. Спробуйте пізніше.",
    cloudUnavailable:
      "☁️ База CRM тимчасово недоступна. Спробуйте пізніше або зателефонуйте: +48 791 257 229",
    linkInvalidCredentials:
      "❌ Обліковий запис не знайдено. Перевірте телефон і номер (як у кабінеті на сайті).",
    invalidName: "❌ Введіть ім'я (мін. 2 символи).",
    invalidPhone: "❌ Коректний номер (мін. 9 цифр).",
    invalidPlate: "❌ Введіть держномер.",
    wrongContact: "❌ Надішліть <b>свій</b> номер кнопкою контакту.",
    noAppointments: "Немає майбутніх записів.",
    cabinetHint: "🌐 Кабінет: https://www.bess-motors.com/cabinet",
    contactsText:
      "<b>BESS MOTORS</b>\n\n📍 Aleja Krakowska 48/52, Warszawa\n☎️ +48 791 257 229\n\n🕐 Pn–Sb 8:00–18:00",
    vinEnter: "🔎 VIN (17 символів):",
    vinInvalid: "❌ VIN — 17 символів.",
    vinNotFound: "❌ VIN не розпізнано.",
    vinPlateAsk: "🚗 Держномер (необов'язково).",
    vinConfirmTitle: "Додати авто?",
    vinConfirmYes: "✅ Додати",
    vinConfirmNo: "❌ Скасувати",
    vinEditVin: "🔄 Інший VIN",
    vinEditPlate: "✏️ Змінити номер",
    vinAdded: "✅ Авто додано.",
    vinDuplicate: "⚠️ VIN вже є.",
    confirmSummaryTitle: "<b>Перевірте дані:</b>",
    bookOnSite: "🌐 Запис на сайті",
    signOnSite: "✍️ Підпис на сайті",
    backToList: "◀️ До списку",
    appointmentStatus: {
      scheduled: "Очікує підтвердження",
      confirmed: "Підтверджено",
      completed: "Завершено",
      cancelled: "Скасовано",
    },
    ordersEmpty: "📋 <b>Замовлення</b>\n\nПоки немає.",
    ordersTitle: (p, t) => `📋 <b>Замовлення</b> (${p}/${t})`,
    orderNotFound: "Замовлення не знайдено.",
    changeLanguage: "🌐 Мова",
    myStatus: "📊 Статус",
    rebook: "🔁 Запис знову",
    galleryPhotos: "🖼 Галерея",
    referralShare: "🎁 Запросити друга",
    quietHours: "🌙 Тихі години",
    quietHoursOn: "✅ Тихі години 22–8",
    quietHoursOff: "🔔 Сповіщення завжди",
    referralText: (link) =>
      `🎁 <b>Запросіть до BESS MOTORS</b>\n\nПосилання:\n${link}`,
    sendPhoto: "📷 Надіслати фото",
    serviceHistory: "📜 Історія",
    rebookWeek: "📅 Через 7 днів",
    photoSaved: (n) => `✅ Фото збережено (${n})`,
    photoFailed: "❌ Не вдалося зберегти фото.",
    notificationsTitle: "🔔 <b>Сповіщення</b>",
    notificationsEmpty: "🔔 <b>Сповіщення</b>\n\nНемає нових.",
    notifCarReady: "Авто готове",
    notifSignRequired: "Потрібен підпис",
    notifAppointment: "Запис",
    notifDefault: "Сповіщення",
    notifStatusUpdated: "оновлено",
    appointmentsTitle: "📅 <b>Найближчі записи</b>",
    appointmentsEmpty: "📅 <b>Записи</b>\n\nНемає майбутніх.",
    carsTitle: "🚗 <b>Мої авто</b>",
    carsEmpty: "🚗 <b>Мої авто</b>\n\nЗ'являться після першого візиту.",
    paid: "оплачено",
    unpaid: "не оплачено",
    needsSignBadge: " · ✍️ підпис",
    orderStatus: "Статус",
    signed: "✅ Підписано",
    needsSignature: "✍️ <b>Потрібен підпис</b>",
    works: "Роботи",
    smartBookHint: "💡 Напишіть, напр.: <i>завтра 17:30 заміна масла</i>",
    symptomQuiz: "🔍 Симптоми / кошторис",
    symptomIntro: "🔍 <b>Що з авто?</b>\n\nОберіть симптоми, потім «Готово».",
    symptomDone: "✅ Готово",
    symptomPickOne: "Оберіть хоча б один симптом.",
    concierge: "🤖 Асистент",
    notifySettings: "🔕 Сповіщення",
    notifySettingsIntro: "🔕 <b>Налаштування сповіщень</b>\n\nКатегорії та «Тиша 7 днів».",
    muteWeekOn: "🔇 Тиша 7 днів",
    muteWeekOff: "🔔 Увімкнути сповіщення",
    shareApt: "📤 Поділитися записом",
    postFollowupTitle: "Контроль після сервісу",
    postFollowupOk: "✅ Все добре",
    postFollowupIssue: "⚠️ Є питання",
    extraWorkTitle: "➕ <b>Додаткові роботи</b>",
    extraWorkPrompt: "Погодити позиції?",
    extraApprove: "✅ Погоджую",
    extraReject: "❌ Відмова",
    promoTitle: "🏷 <b>Промокоди</b>",
    promoEmpty: "Немає активних кодів.",
    packagesBtn: "📦 Пакети послуг",
    locationBtn: "📍 Маршрут",
    warrantyBtn: "🛡 Гарантія",
    vehiclePick: "🚗 Обрати авто",
    priceListBtn: "💰 Ціни",
    promoBtn: "🏷 Промокоди",
    emergencyBtn: "🆘 Екстренно",
    contactCardBtn: "📇 Контакт",
    favoritesBtn: "⭐ Обране",
    etaBtn: "⏱ Термін",
    shareBtn: "📤 Поділитися",
    repeatBtn: "🔁 Повторити",
    plusOneDay: "+1 день",
    plusSevenDays: "+7 дн.",
    photoUploadHint: "📷 Щоб прикріпити фото — натисніть «Надіслати фото» в меню.",
    bookingDraftTitle: "📝 <b>Розпізнано запис:</b>",
    confirmAboveHint: "👆 Підтвердіть кнопкою вище або /menu для скасування.",
    feedbackThanks: "Дякуємо за відгук! 🙏",
    favoritesPick: "⭐ Оберіть улюблену послугу:",
    noActiveWorkOrders: "📋 Немає активних замовлень.",
    noHistory: "📜 Немає історії.",
    serviceHistoryTitle: "📜 <b>Історія сервісу</b>",
    noWarranty: "🛡 Немає активної гарантії.",
    warrantyTitle: "🛡 <b>Гарантія</b>",
    singleVehicleHint: "🚗 У профілі одне авто.",
    estimateTitle: "💡 <b>Орієнтовний кошторис</b>",
    estimateRange: (min, max) => `Разом: орієнтир <b>${min}–${max}</b> zł`,
    priceFromPrefix: "від ",
    yourCar: "Ваш автомобіль",
    workSection: "Роботи:",
    conciergeEmpty: "Немає активного замовлення.",
    priceListTitle: "💰 <b>Орієнтири цін</b> (від):",
    priceListFooter: "\n\nПовний прайс: bessmotors.pl/cennik",
    referralNoData: "Немає даних.",
    referralHead: "🎁 <b>Реферальна програма</b>",
    referralEmpty: "Поки нікого.",
    referralNewJoin: (name) => `🎁 <b>Новий реферал</b>\n${name} приєднався за вашим посиланням.`,
    repeatComment: (services) => `Повтор: ${services}`,
    queueLine: (pos, total) => `📊 Черга: близько <b>${pos}</b> з <b>${total}</b>`,
    rebookWeekTitle: "📅 <b>Той самий запис через 7 днів</b>",
    rebookAgainTitle: "🔁 <b>Повторний запис</b>",
    galleryTitle: "🖼 <b>Фото робіт</b>",
    rebookDateHint: "Оберіть дату в меню «Записатися» або напишіть нам.",
    symptomPickHint: "👆 Оберіть симптоми кнопками вище.",
    noActiveOrderForPhoto: "📷 Немає активного замовлення для фото.",
    photoAttachHint: "📷 Надішліть фото — прикріпимо до замовлення.",
    aptMoved: (days, date, time) => `✅ Перенесено на ${days} дн.: ${date} ${time}`,
    conciergeIntro: "🤖 <b>Асистент</b>\n\nНемає активного замовлення. Запишіться або відкрийте історію.",
    waitingPartsHint: "⏳ <b>Чекаємо на запчастини</b> — повідомимо.",
    readyHint: "✅ Авто готове до видачі!",
    filesOnOrder: (count) => `📎 Файлів у замовленні: <b>${count}</b>`,
    shareAptTitle: "📤 <b>Запис BESS MOTORS</b>",
    referralHeadCount: (q, r) => `🎁 <b>Запрошення:</b> ${q}/${r}`,
    referralDiscountActive: "\n\n🎉 Знижка 15% активна!",
    postFollowupThanks: "✅ Дякуємо! Якщо щось зміниться — напишіть або замовте дзвінок.",
    callRequestSent: "📞 Заявку на дзвінок надіслано — передзвонимо.",
    repairStatus: {
      received: "Прийнято",
      diagnostic: "Діагностика",
      repair: "Ремонт",
      waitingParts: "Очікування запчастин",
      ready: "Готовий",
      delivered: "Видано",
    },
  },
  en: {
    startBtn: "🏠 Start",
    startKeyboardHint: "Tap <b>Start</b> below to open the main menu.",
    chooseLanguage: "🌐 <b>Choose your language</b>\n\nSelect bot language:",
    languageSaved: (name) => `✅ Language: <b>${name}</b>`,
    welcome:
      "🛠 <b>BESS MOTORS</b> — car service Warsaw\n\n📅 Book · 📞 Call back · 🔐 Client account",
    welcomeLinked: "Account linked.",
    linkedWelcome: (name) =>
      `👋 <b>Hello, ${name}!</b>\n\n📋 Work orders · 📅 Appointments · 🔔 Notifications`,
    book: "📅 Book visit",
    call: "📞 Request call",
    myAppointments: "📅 My appointments",
    myOrders: "📋 Work orders",
    notifications: "🔔 Notifications",
    myCars: "🚗 My cars",
    fleetFinance: "💳 Billing",
    fleetReportTitle: "💳 <b>Financial report — your vehicles</b>",
    fleetReportEmpty:
      "💳 <b>Billing</b>\n\nNo orders yet. After your first visit you will see amounts and payment status here.",
    fleetTotalAll: (a) => `📊 Total services: <b>${a}</b>`,
    fleetTotalPaid: (a) => `✅ Paid: <b>${a}</b>`,
    fleetTotalUnpaid: (a) => `⏳ Due: <b>${a}</b>`,
    fleetOrderStats: (paid, unpaid) =>
      `Orders: ${paid} paid · ${unpaid} due`,
    fleetByVehicle: "<b>By vehicle:</b>",
    fleetNoUnpaid: "✅ Nothing due — thank you!",
    fleetUnpaidList: "Unpaid orders",
    fleetMoreOrders: (n) => `… and ${n} more orders`,
    fleetCarDetailTitle: (plate) => `🚗 <b>${plate}</b>`,
    fleetCarNoDebt: "✅ All orders for this car are paid.",
    carDebtLine: (a, n) => `⏳ Due: <b>${a}</b> (${n} orders)`,
    carAllPaid: "✅ Paid",
    carsTotalDebt: (a) => `\n<b>Total due: ${a}</b>`,
    fleetNotAvailable:
      "This section is for fleet clients only. Contact the workshop if you need fleet billing access.",
    fleetUnpaidSection: "⏳ Due",
    fleetPaidSection: "✅ Paid",
    fleetIdleSection: "🚗 No orders on file",
    carNoOrders: "No orders",
    fleetCarsHint: "💡 Full report: «Billing» in the menu.",
    addVin: "➕ Add VIN",
    activate: "🔐 Link account",
    contacts: "📍 Contacts",
    menu: "🏠 Main menu",
    back: "◀️ Back",
    site: "🌐 Website",
    cabinetSite: "🌐 Web account",
    chooseService: "Choose a service:",
    chooseDate: "Choose visit date:",
    chooseTime: "Choose time:",
    enterName: "✏️ Enter your name:",
    enterPhone: "📱 Enter phone number:",
    enterComment: "💬 Describe the issue (or Skip):",
    linkIntro:
      "🔐 <b>Link your account</b>\n\nSend your <b>phone number</b> linked to Telegram.\n\nButton below or type +48...",
    linkPhoneAccepted: (phone) =>
      `✅ Phone: <b>${phone}</b>\n\nEnter <b>license plate</b> (e.g. WA12345).\n\nSite password.`,
    enterPlate: "🚗 Enter <b>license plate</b>.\n\nLogin: <code>phone + plate</code>",
    linkConfirmTitle: "📋 <b>Check details</b>",
    linkConfirmPhone: "📱 Phone",
    linkConfirmPlate: "🚗 Plate",
    linkConfirmHint: "Confirm or edit.",
    linkDataCorrect: "✅ Correct",
    linkDataWrong: "❌ Incorrect",
    linkEditPhone: "📱 Change phone",
    linkEditPlate: "🚗 Change plate",
    linkRestart: "🔄 Start over",
    linkWhatToFix: "What to fix?",
    linkSuccess: "✅ <b>Account linked!</b>\n\nStatuses and reminders in Telegram.\n\nbess-motors.com/cabinet",
    linkPhoneBtn: "📱 Send my phone number",
    signIntro: "✍️ <b>Sign work order</b>\n\nLink your account first.",
    confirmBooking: "✅ Confirm booking",
    confirmCall: "✅ Confirm request",
    skip: "⏭ Skip",
    cancel: "❌ Cancel",
    saved: "✅ <b>Request received!</b>\n\nWe will confirm shortly.\n\n☎️ +48 791 257 229",
    callSaved: "✅ <b>Call request received!</b>\n\n☎️ +48 791 257 229",
    saveFailed: "❌ Could not save. Try again or call us.",
    cloudUnavailable:
      "☁️ CRM database is temporarily unavailable. Try again shortly or call +48 791 257 229",
    linkInvalidCredentials:
      "❌ Account not found. Check phone and plate (same as on the website client portal).",
    invalidName: "❌ Enter name (min. 2 characters).",
    invalidPhone: "❌ Valid phone required (min. 9 digits).",
    invalidPlate: "❌ Enter license plate.",
    wrongContact: "❌ Send <b>your</b> contact via the button.",
    noAppointments: "No upcoming appointments.",
    cabinetHint: "🌐 Full account: https://www.bess-motors.com/cabinet",
    contactsText:
      "<b>BESS MOTORS</b>\n\n📍 Aleja Krakowska 48/52, Warsaw\n☎️ +48 791 257 229\n\n🕐 Mon–Sat 8:00–18:00",
    vinEnter: "🔎 Enter VIN (17 chars):",
    vinInvalid: "❌ VIN must be 17 characters.",
    vinNotFound: "❌ VIN not recognized.",
    vinPlateAsk: "🚗 Plate (optional).",
    vinConfirmTitle: "Add vehicle?",
    vinConfirmYes: "✅ Add",
    vinConfirmNo: "❌ Cancel",
    vinEditVin: "🔄 Other VIN",
    vinEditPlate: "✏️ Edit plate",
    vinAdded: "✅ Vehicle added.",
    vinDuplicate: "⚠️ VIN already in garage.",
    confirmSummaryTitle: "<b>Please confirm:</b>",
    bookOnSite: "🌐 Book online",
    signOnSite: "✍️ Sign on website",
    backToList: "◀️ Back to list",
    appointmentStatus: {
      scheduled: "Awaiting confirmation",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    ordersEmpty: "📋 <b>Work orders</b>\n\nNone yet.",
    ordersTitle: (p, t) => `📋 <b>Work orders</b> (${p}/${t})`,
    orderNotFound: "Work order not found.",
    changeLanguage: "🌐 Language",
    myStatus: "📊 Status",
    rebook: "🔁 Book again",
    galleryPhotos: "🖼 Gallery",
    referralShare: "🎁 Refer a friend",
    quietHours: "🌙 Quiet hours",
    quietHoursOn: "✅ Quiet hours on (22:00–08:00)",
    quietHoursOff: "🔔 Notifications anytime",
    referralText: (link) =>
      `🎁 <b>Refer BESS MOTORS</b>\n\nShare this link:\n${link}`,
    sendPhoto: "📷 Send photo",
    serviceHistory: "📜 History",
    rebookWeek: "📅 In 7 days",
    photoSaved: (n) => `✅ Photo saved (${n})`,
    photoFailed: "❌ Could not save photo.",
    notificationsTitle: "🔔 <b>Notifications</b>",
    notificationsEmpty: "🔔 <b>Notifications</b>\n\nNo new notifications.",
    notifCarReady: "Car ready",
    notifSignRequired: "Signature required",
    notifAppointment: "Appointment",
    notifDefault: "Notification",
    notifStatusUpdated: "updated",
    appointmentsTitle: "📅 <b>Upcoming appointments</b>",
    appointmentsEmpty: "📅 <b>Appointments</b>\n\nNo upcoming visits.",
    carsTitle: "🚗 <b>My cars</b>",
    carsEmpty: "🚗 <b>My cars</b>\n\nVehicles appear after your first visit.",
    paid: "paid",
    unpaid: "unpaid",
    needsSignBadge: " · ✍️ sign required",
    orderStatus: "Status",
    signed: "✅ Signed",
    needsSignature: "✍️ <b>Signature required</b>",
    works: "Services",
    smartBookHint: "💡 Type e.g. <i>tomorrow 5pm oil change</i>",
    symptomQuiz: "🔍 Symptoms / estimate",
    symptomIntro: "🔍 <b>What is wrong with the car?</b>\n\nPick symptoms, then «Done».",
    symptomDone: "✅ Done",
    symptomPickOne: "Pick at least one symptom.",
    concierge: "🤖 Concierge",
    notifySettings: "🔕 Notifications",
    notifySettingsIntro:
      "🔕 <b>Notification settings</b>\n\nToggle categories. «Mute 7 days» pauses reminders (signatures still work).",
    muteWeekOn: "🔇 Mute for 7 days",
    muteWeekOff: "🔔 Unmute",
    shareApt: "📤 Share appointment",
    postFollowupTitle: "Post-service check",
    postFollowupOk: "✅ All good",
    postFollowupIssue: "⚠️ I have a question",
    extraWorkTitle: "➕ <b>Additional work</b>",
    extraWorkPrompt: "Approve these items?",
    extraApprove: "✅ Approve",
    extraReject: "❌ Decline",
    promoTitle: "🏷 <b>Promo codes</b>",
    promoEmpty: "No active codes — check the website.",
    packagesBtn: "📦 Service packages",
    locationBtn: "📍 Directions",
    warrantyBtn: "🛡 Warranty",
    vehiclePick: "🚗 Pick vehicle",
    priceListBtn: "💰 Prices",
    promoBtn: "🏷 Promo codes",
    emergencyBtn: "🆘 Emergency",
    contactCardBtn: "📇 Contact",
    favoritesBtn: "⭐ Favorites",
    etaBtn: "⏱ ETA",
    shareBtn: "📤 Share",
    repeatBtn: "🔁 Repeat",
    plusOneDay: "+1 day",
    plusSevenDays: "+7 days",
    photoUploadHint: "📷 To attach a photo to your order — use «Send photo» in the menu.",
    bookingDraftTitle: "📝 <b>Booking draft:</b>",
    confirmAboveHint: "👆 Confirm with the button above or type /menu to cancel.",
    feedbackThanks: "Thanks for your feedback!",
    favoritesPick: "⭐ Pick a favorite service:",
    noActiveWorkOrders: "📋 No active work orders.",
    noHistory: "📜 No history yet.",
    serviceHistoryTitle: "📜 <b>Service history</b>",
    noWarranty: "🛡 No active warranty.",
    warrantyTitle: "🛡 <b>Warranty</b>",
    singleVehicleHint: "🚗 You have one vehicle on file.",
    estimateTitle: "💡 <b>Estimate (indicative)</b>",
    estimateRange: (min, max) => `Total: approx. <b>${min}–${max}</b> PLN`,
    priceFromPrefix: "from ",
    yourCar: "Your car",
    workSection: "Work:",
    conciergeEmpty: "No active work order.",
    priceListTitle: "💰 <b>Prices</b> (from):",
    priceListFooter: "\n\nFull list: bessmotors.pl/cennik",
    referralNoData: "No data.",
    referralHead: "🎁 <b>Referral program</b>",
    referralEmpty: "No referrals yet.",
    referralNewJoin: (name) => `🎁 <b>New referral</b>\n${name} joined via your link.`,
    repeatComment: (services) => `Repeat: ${services}`,
    queueLine: (pos, total) => `📊 Queue: about <b>${pos}</b> of <b>${total}</b>`,
    rebookWeekTitle: "📅 <b>Same visit in 7 days</b>",
    rebookAgainTitle: "🔁 <b>Book again</b>",
    galleryTitle: "🖼 <b>Repair photos</b>",
    rebookDateHint: "Use «Book visit» in the menu to pick a date.",
    symptomPickHint: "👆 Pick symptoms using the buttons above.",
    noActiveOrderForPhoto: "📷 No active work order to attach a photo.",
    photoAttachHint: "📷 Send a photo — we will attach it to your work order.",
    aptMoved: (days, date, time) => `✅ Moved by ${days} days: ${date} ${time}`,
    conciergeIntro: "🤖 <b>Concierge</b>\n\nNo active work order. Book a visit or check history.",
    waitingPartsHint: "⏳ <b>Waiting for parts</b> — we will notify you.",
    readyHint: "✅ Car ready for pickup!",
    filesOnOrder: (count) => `📎 Files on order: <b>${count}</b>`,
    shareAptTitle: "📤 <b>BESS MOTORS appointment</b>",
    referralHeadCount: (q, r) => `🎁 <b>Referrals:</b> ${q}/${r}`,
    referralDiscountActive: "\n\n🎉 15% discount active!",
    postFollowupThanks: "✅ Thanks! If anything changes — message us or request a call.",
    callRequestSent: "📞 Call request sent — we will call you back.",
    repairStatus: {
      received: "Received",
      diagnostic: "Diagnostics",
      repair: "In repair",
      waitingParts: "Waiting for parts",
      ready: "Ready",
      delivered: "Delivered",
    },
  },
};

export function getClientBotLabels(locale: BotLocale): ClientBotLabels {
  return LABELS[locale];
}

/** PL / RU / EN content pick for bilingual price-list data etc. */
export function botContentLocale(locale: BotLocale): "pl" | "ru" | "en" {
  if (locale === "ru" || locale === "uk") return "ru";
  if (locale === "en") return "en";
  return "pl";
}

export const LANGUAGE_NAMES: Record<BotLocale, string> = {
  pl: "Polski",
  ru: "Русский",
  uk: "Українська",
  en: "English",
};

/** All localized Start button labels + commands */
const START_TEXTS = new Set(
  BOT_LOCALES.flatMap((loc) => [
    getClientBotLabels(loc).startBtn,
    getClientBotLabels(loc).menu,
    "/start",
    "/menu",
  ])
);

export function isStartCommand(text: string): boolean {
  const t = text.trim();
  if (t.startsWith("/start")) return true;
  if (t === "/menu") return true;
  return START_TEXTS.has(t);
}
