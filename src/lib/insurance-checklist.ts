export type InsuranceCheckItem = {
  id: string;
  pl: string;
  ru: string;
  en: string;
};

export const insuranceClaimChecklist: InsuranceCheckItem[] = [
  {
    id: "photos",
    pl: "Zdjęcia uszkodzeń ze wszystkich stron",
    ru: "Фото повреждений со всех сторон",
    en: "Damage photos from all sides",
  },
  {
    id: "plate",
    pl: "Tablica rejestracyjna na zdjęciu",
    ru: "Госномер на фото",
    en: "License plate visible",
  },
  {
    id: "vin",
    pl: "Numer VIN (z dowodu lub tabliczki)",
    ru: "VIN (из документов или таблички)",
    en: "VIN number (documents or plate)",
  },
  {
    id: "policy",
    pl: "Polisa OC / AC (zdjęcie lub PDF)",
    ru: "Полис OC / AC (фото или PDF)",
    en: "Insurance policy OC/AC",
  },
  {
    id: "report",
    pl: "Protokół policyjny (jeśli był)",
    ru: "Протокол ДТП (если был)",
    en: "Police report (if any)",
  },
  {
    id: "estimate",
    pl: "Wstępna wycena z serwisu",
    ru: "Предварительная смета из сервиса",
    en: "Preliminary repair estimate",
  },
  {
    id: "contact",
    pl: "Dane likwidatora ubezpieczyciela",
    ru: "Контакты страхового агента",
    en: "Insurer adjuster contacts",
  },
];

export function checklistLabel(item: InsuranceCheckItem, locale: string): string {
  if (locale === "ru" || locale === "uk") return item.ru;
  if (locale === "en") return item.en;
  return item.pl;
}
