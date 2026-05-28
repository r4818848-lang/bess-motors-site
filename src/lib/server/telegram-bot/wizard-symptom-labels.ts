import type { WizardSymptomId } from "@/lib/car-problem-wizard";
import type { BotLocale } from "./client-i18n";

const LABELS: Record<WizardSymptomId, Record<BotLocale, string>> = {
  check_engine: { pl: "Check Engine", ru: "Check Engine", uk: "Check Engine", en: "Check Engine" },
  noise_suspension: { pl: "Stuk / zawieszenie", ru: "Стук / подвеска", uk: "Стук / підвіска", en: "Knock / suspension" },
  brakes_weak: { pl: "Słabe hamulce", ru: "Слабые тормоза", uk: "Слабкі гальма", en: "Weak brakes" },
  ac_weak: { pl: "Słaba klimatyzacja", ru: "Слабый кондиционер", uk: "Слабкий кондиціонер", en: "Weak A/C" },
  oil_service: { pl: "Serwis oleju", ru: "Замена масла", uk: "Заміна масла", en: "Oil service" },
  tires: { pl: "Opony / geometria", ru: "Шины / развал", uk: "Шини / розвал", en: "Tires / alignment" },
  chip_power: { pl: "Chip / moc", ru: "Чип / мощность", uk: "Чіп / потужність", en: "Chip tuning" },
  electrical: { pl: "Elektryka", ru: "Электрика", uk: "Електрика", en: "Electrical" },
};

export function symptomLabel(id: WizardSymptomId, locale: BotLocale): string {
  return LABELS[id]?.[locale] ?? id;
}
