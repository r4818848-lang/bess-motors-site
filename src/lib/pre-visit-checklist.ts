/** Pre-visit hints by booking service id (no external APIs) */

const CHECKLISTS: Record<string, string[]> = {
  oil: [
    "Przyjedź z aktualnym przebiegiem (km).",
    "Jeśli masz — zabierz nowy filtr oleju (opcjonalnie).",
  ],
  diagnostic: [
    "Opisz objawy: kiedy, jak często, czy świeci Check Engine.",
    "Zabierz kluczyki i dokumenty auta.",
  ],
  brakePads: [
    "Jeśli słyszysz pisk — nie zwlekaj z wizytą.",
    "Auto może być lekko używane po serwisie (dotarcie klocków).",
  ],
  tires: [
    "Zostaw klucz do kół / śrub zabezpieczających.",
  ],
  acRefill: [
    "Jeśli klimatyzacja słabo chłodzi — zanotuj kiedy (rano/wieczór).",
    "Auto może stać na placu 30–60 min.",
  ],
  acRepair: [
    "Opisz zapach / wilgoć z nawiewów, jeśli występuje.",
  ],
  suspension: [
    "Opisz na jakiej nawierzchni słychać stuk (dziury / prosto).",
  ],
  filters: ["Zabierz numer VIN lub dowód rejestracyjny."],
  electric: [
    "Opisz, czy problem stały czy sporadyczny.",
    "Nie odłączaj akumulatora przed wizytą bez konsultacji.",
  ],
  timingBelt: [
    "Podaj przebieg i datę ostatniej wymiany rozrządu, jeśli znasz.",
  ],
  brakesFull: [
    "Jeśli wibruje kierownica przy hamowaniu — napisz w komentarzu.",
  ],
  default: [
    "Zabierz dokumenty auta i kluczyki.",
    "Zostaw kontaktowy numer telefonu.",
    "Przyjedź 5 min wcześniej.",
  ],
};

const CHECKLISTS_RU: Record<string, string[]> = {
  oil: [
    "Укажите актуальный пробег (км).",
    "При желании — новый масляный фильтр (не обязательно).",
  ],
  diagnostic: [
    "Опишите симптомы: когда, как часто, горит ли Check Engine.",
    "Документы и ключи от авто.",
  ],
  brakePads: [
    "Если слышен писк — не откладывайте визит.",
    "После замены колодок возможен лёгкий скрип при притирке.",
  ],
  tires: ["Оставьте ключ от колёс / секретки, если есть."],
  acRefill: [
    "Когда слабо холодит кондиционер (утро/вечер/жара).",
    "Авто может простоять на сервисе 30–60 мин.",
  ],
  suspension: ["На какой дороге стук — ямы или ровная трасса."],
  electric: ["Проблема постоянная или «плавающая»?"],
  default: [
    "Документы и ключи от автомобиля.",
    "Контактный телефон.",
    "Приезжайте за 5 минут до времени записи.",
  ],
};

export function getPreVisitChecklist(
  serviceId: string,
  locale: "pl" | "ru" | "uk" | "en"
): string[] {
  const useRu = locale === "ru" || locale === "uk";
  const map = useRu ? CHECKLISTS_RU : CHECKLISTS;
  return map[serviceId] ?? map.default ?? CHECKLISTS.default;
}

export function formatPreVisitChecklistText(
  serviceId: string,
  locale: "pl" | "ru" | "uk" | "en"
): string {
  const items = getPreVisitChecklist(serviceId, locale);
  const title =
    locale === "pl"
      ? "📋 <b>Przed wizytą:</b>"
      : locale === "en"
        ? "📋 <b>Before your visit:</b>"
        : "📋 <b>Перед визитом:</b>";
  return [title, "", ...items.map((x) => `• ${x}`)].join("\n");
}
