import { TIRE_PROMO_EXTRAS } from "@/lib/tire-promo-prices";

/** Public tyre landings that show the short visit form. */
export const TIRE_QUICK_BOOK_SLUGS = [
  "opony",
  "wulkanizacja-warszawa",
  "wymiana-opon-warszawa",
  "wywazanie-kol-warszawa",
  "naprawa-opon-warszawa",
  "sezonowa-wymiana-opon-warszawa",
] as const;

export type TireQuickBookSlug = (typeof TIRE_QUICK_BOOK_SLUGS)[number];

export function isTireQuickBookSlug(slug: string): slug is TireQuickBookSlug {
  return (TIRE_QUICK_BOOK_SLUGS as readonly string[]).includes(slug);
}

export const TIRE_QUICK_FORM_ID = "zapis-opony";

/** R24 stays off the public form. It is not a public offer. */
export const TIRE_PUBLIC_RIM_SIZES = [
  "R13",
  "R14",
  "R15",
  "R16",
  "R17",
  "R18",
  "R19",
  "R20",
  "R21",
  "R22",
  "R23",
] as const;

export type TirePublicRim = (typeof TIRE_PUBLIC_RIM_SIZES)[number];

export const TIRE_QUICK_SERVICES = [
  { id: "change", labelPl: "Wymiana kompletu" },
  { id: "season", labelPl: "Sezonowa wymiana" },
  { id: "balance", labelPl: "Wyważanie kół" },
  { id: "repair", labelPl: "Naprawa przebicia" },
  { id: "storage", labelPl: "Przechowywanie opon bez felg" },
  { id: "storageRims", labelPl: "Przechowywanie kół na felgach" },
] as const;

export type TireQuickServiceId = (typeof TIRE_QUICK_SERVICES)[number]["id"];

export function tireQuickServiceLabel(id: string): string | null {
  return TIRE_QUICK_SERVICES.find((item) => item.id === id)?.labelPl ?? null;
}

export type TireQuickInput = {
  serviceId: string;
  rim: string;
  date: string;
  time: string;
  phone: string;
};

export type TireQuickBooking = {
  appointmentId: string;
  serviceId: "tires";
  serviceIds: ["tires"];
  date: string;
  time: string;
  comment: string;
  clientName: string;
  clientPhone: string;
  clientPlate: string;
};

export type TireQuickError = "service" | "rim" | "date" | "time" | "phone";

/** Same phone, date and time always map to one visit id. A retry does not create a second visit. */
export function tireQuickAppointmentId(phone: string, date: string, time: string): string {
  const digits = phone.replace(/\D/g, "");
  const raw = `tire|${digits}|${date}|${time}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `apt-tire-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function buildTireQuickBooking(
  input: TireQuickInput
): { ok: true; booking: TireQuickBooking } | { ok: false; error: TireQuickError } {
  const service = tireQuickServiceLabel(input.serviceId);
  if (!service) return { ok: false, error: "service" };
  const rim = input.rim.trim().toUpperCase();
  if (!(TIRE_PUBLIC_RIM_SIZES as readonly string[]).includes(rim)) return { ok: false, error: "rim" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "date" };
  if (!/^\d{2}:\d{2}$/.test(input.time)) return { ok: false, error: "time" };
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 9) return { ok: false, error: "phone" };
  const phone = digits.length === 9 ? `+48${digits}` : `+${digits}`;
  return {
    ok: true,
    booking: {
      appointmentId: tireQuickAppointmentId(phone, input.date, input.time),
      serviceId: "tires",
      serviceIds: ["tires"],
      date: input.date,
      time: input.time,
      comment: `Zapis z formularza opon. Usługa: ${service}. Rozmiar: ${rim}.`,
      clientName: `Klient ${digits.slice(-9)}`,
      clientPhone: phone,
      clientPlate: "",
    },
  };
}

/** Answers shown next to the form. Numbers come from the price list. */
export function tireQuickAnswerPl(): string {
  return `Komplet zwykle 45–90 min. Cena zależy od rozmiaru R i jest w tabeli na tej stronie. RunFlat +${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/koło. Opony bez felg ${TIRE_PROMO_EXTRAS.storageLooseSeasonZl} zł/sezon, koła na felgach ${TIRE_PROMO_EXTRAS.storageRimsSeasonZl} zł/sezon. R24 nie jest w ofercie publicznej.`;
}
