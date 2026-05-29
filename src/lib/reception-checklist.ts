export type ChecklistItem = { id: string; pl: string; ru: string; en: string };

export const receptionChecklistItems: ChecklistItem[] = [
  { id: "mileage", pl: "Przebieg zapisany", ru: "Пробег записан", en: "Mileage recorded" },
  { id: "damage", pl: "Uszkodzenia sfotografowane", ru: "Повреждения сфотографированы", en: "Damage photographed" },
  { id: "keys", pl: "Kluczyki przyjęte", ru: "Ключи приняты", en: "Keys received" },
  { id: "fluids", pl: "Poziom płynów sprawdzony", ru: "Уровень жидкостей проверен", en: "Fluids checked" },
  { id: "client", pl: "Klient poinformowany o czasie", ru: "Клиент проинформирован о сроках", en: "Client informed on ETA" },
];

export const deliveryChecklistItems: ChecklistItem[] = [
  { id: "work", pl: "Prace wykonane zgodnie z WZ", ru: "Работы выполнены по заказ-наряду", en: "Work per work order" },
  { id: "paid", pl: "Rozliczenie / płatność", ru: "Оплата", en: "Payment settled" },
  { id: "clean", pl: "Auto przekazane czyste", ru: "Авто выдано чистым", en: "Vehicle clean" },
  { id: "docs", pl: "Dokumenty / gwarancja przekazane", ru: "Документы / гарантия переданы", en: "Docs / warranty handed" },
];

export function checklistLabel(item: ChecklistItem, locale: string): string {
  if (locale === "ru" || locale === "uk") return item.ru;
  if (locale === "en") return item.en;
  return item.pl;
}

export function allChecked(
  items: ChecklistItem[],
  state: Record<string, boolean> | undefined
): boolean {
  return items.every((i) => state?.[i.id]);
}
