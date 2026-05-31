/** Quick-add labor lines in create-order modal */
export const crmWorkLineTemplates: { id: string; pl: string; ru: string; en: string }[] = [
  { id: "diag", pl: "Diagnostyka komputerowa", ru: "Компьютерная диагностика", en: "Computer diagnostics" },
  { id: "oil", pl: "Wymiana oleju i filtra", ru: "Замена масла и фильтра", en: "Oil and filter change" },
  { id: "brakes", pl: "Hamulce — przegląd", ru: "Тормоза — осмотр", en: "Brake inspection" },
  { id: "ac", pl: "Serwis klimatyzacji", ru: "Сервис кондиционера", en: "A/C service" },
  { id: "tires", pl: "Wymiana opon / wyważanie", ru: "Шиномонтаж / балансировка", en: "Tire change / balance" },
];

export function workTemplateLabel(
  item: (typeof crmWorkLineTemplates)[0],
  locale: string
): string {
  if (locale === "ru" || locale === "uk") return item.ru;
  if (locale === "en") return item.en;
  return item.pl;
}
