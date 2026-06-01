import type { ServiceId } from "@/lib/services-catalog";

/** Polish FAQ blocks — shared by UI and FAQPage schema on landing pages */
export const SEO_SERVICE_FAQ_PL: Partial<
  Record<ServiceId, { q: string; a: string }[]>
> = {
  diagnostic: [
    { q: "Ile trwa diagnostyka?", a: "Zwykle 30–60 min, zależnie od objawów." },
    { q: "Czy muszę zapisać się wcześniej?", a: "Tak — rezerwacja skraca czas oczekiwania." },
  ],
  oil: [
    { q: "Jaki olej używacie?", a: "Dobieramy specyfikację pod VIN i przebieg." },
    { q: "Czy wymiana trwa długo?", a: "Standardowo ok. 1 godziny." },
  ],
  brakePads: [
    {
      q: "Skąd wiem, że klocki są zużyte?",
      a: "Pisk, dłuższy hamulec, kontrolka ABS.",
    },
  ],
  acRefill: [
    {
      q: "Jak często serwisować klimatyzację?",
      a: "Co 1–2 lata lub gdy słaba chłodziwość / zapach.",
    },
  ],
  chip: [
    {
      q: "Czy chip tuning jest bezpieczny?",
      a: "Po diagnostyce i w granicach fabrycznej tolerancji silnika.",
    },
  ],
  stage1: [
    {
      q: "Ile trwa Stage 1?",
      a: "Zwykle 1 dzień — diagnostyka, mapa, jazda testowa.",
    },
  ],
};

export function getServiceFaqForSchema(
  serviceId?: ServiceId
): { q: string; a: string }[] {
  if (!serviceId) return [];
  return SEO_SERVICE_FAQ_PL[serviceId] ?? [];
}
