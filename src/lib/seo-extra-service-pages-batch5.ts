/**
 * Model × service SEO landings (tires / brakes) driven by workshop photos.
 * Merged via seo-extra-service-pages.ts
 */
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import type { LocalizedText } from "@/lib/service-landing-content";
import type { SlugLandingProfile } from "@/lib/seo-landing-slug-profiles";
import { getPriceItem } from "@/lib/price-list";
import { MODEL_SERVICE_CASES, type ModelServiceCase } from "@/lib/model-service-media";
import {
  TIRE_PROMO_FROM_ZL,
  TIRE_PROMO_SUMMARY_SHORT_PL,
  TIRE_PROMO_EXTRAS,
} from "@/lib/tire-promo-prices";

const L = (pl: string, ru: string, en?: string, uk?: string): LocalizedText => ({
  pl,
  ru,
  en,
  uk,
});

function tirePage(c: ModelServiceCase): SeoLandingPage {
  return {
    slug: c.tireSlug,
    title: `Wymiana opon ${c.label} Warszawa`,
    line1: `Komplet od ${TIRE_PROMO_FROM_ZL} zł — zdjęcie z warsztatu`,
    line2: `Aleja Krakowska 48/52 · ${c.label} · umów termin online`,
    metaTitle: `Wymiana opon ${c.label} Warszawa | od ${TIRE_PROMO_FROM_ZL} zł | BESS MOTORS`,
    metaDescription: `Wymiana opon ${c.label} Warszawa — ${TIRE_PROMO_SUMMARY_SHORT_PL}. Warsztat: Aleja Krakowska 48/52. Umów wizytę online lub +48 791 257 229.`,
    serviceId: "tires",
    icon: "Circle",
  };
}

function brakePage(c: ModelServiceCase): SeoLandingPage {
  const from = getPriceItem("brake_pads_front")?.basePrice ?? 100;
  return {
    slug: c.brakeSlug,
    title: `Wymiana klocków hamulcowych ${c.label} Warszawa`,
    line1: `Robocizna od ${from} zł — kod BessMotors`,
    line2: `BESS MOTORS Włochy · ${c.label} · wycena przed montażem`,
    metaTitle: `Wymiana klocków ${c.label} Warszawa | BESS MOTORS`,
    metaDescription: `Wymiana klocków hamulcowych ${c.label} Warszawa Włochy — robocizna od ${from} zł (kod BessMotors). BESS MOTORS, Aleja Krakowska 48/52. Umów wizytę.`,
    serviceId: "brakePads",
    icon: "Disc",
  };
}

function tireProfile(c: ModelServiceCase): SlugLandingProfile {
  return {
    bookServiceId: "tires",
    contentServiceId: "tires",
    galleryTags: [...c.galleryTags, "opon", "tire", "wulkan"],
    faqDuration: L(
      `Wymiana opon ${c.label}: zwykle 45–90 minut na komplet z wyważaniem.`,
      `Замена шин ${c.label}: обычно 45–90 минут на комплект.`,
      `${c.label} tyre change: usually 45–90 minutes for a set with balancing.`,
      `Заміна шин ${c.label}: зазвичай 45–90 хвилин.`
    ),
    price: {
      fromZl: getPriceItem("tire_change_r13")?.basePrice ?? TIRE_PROMO_FROM_ZL,
      priceFrom: true,
      materialsExtra: false,
      note: L(
        `Cennik promocji: ${TIRE_PROMO_SUMMARY_SHORT_PL}. RunFlat +${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/koło, TPMS +${TIRE_PROMO_EXTRAS.tpmsPerWheelZl} zł/koło. ${c.label} — te same procedury i momenty dokręcenia.`,
        `Акция: ${TIRE_PROMO_SUMMARY_SHORT_PL}. RunFlat +${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/колесо, TPMS +${TIRE_PROMO_EXTRAS.tpmsPerWheelZl} zł/колесо.`,
        `Promo: ${TIRE_PROMO_SUMMARY_SHORT_PL}. RunFlat +${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/wheel, TPMS +${TIRE_PROMO_EXTRAS.tpmsPerWheelZl} zł/wheel.`,
        `Акція: ${TIRE_PROMO_SUMMARY_SHORT_PL}.`
      ),
      includes: [
        L(`Demontaż / montaż opon ${c.label} + wyważanie`, `Демонтаж/монтаж шин ${c.label} + балансировка`, `${c.label} tyre demount/mount + balancing`, `Демонтаж/монтаж шин ${c.label}`),
        L("Czyszczenie piast, ciśnienie, klucz dynamometryczny", "Очистка ступиц, давление, динамоключ", "Hub clean, pressure, torque wrench", "Очищення маточин, тиск"),
      ],
    },
    education: [
      {
        title: L(
          `Wymiana opon ${c.label} w Warszawie`,
          `Шиномонтаж ${c.label} в Варшаве`,
          `${c.label} tyre change in Warsaw`,
          `Шиномонтаж ${c.label} у Варшаві`
        ),
        body: L(
          `Na zdjęciu — realna obsługa ${c.label} w BESS MOTORS (Aleja Krakowska 48/52). Sezonowa wymiana, wyważanie, RunFlat i TPMS. Nie jesteśmy dealerem ${c.brand} — niezależny warsztat.`,
          `На фото — реальный сервис ${c.label} в BESS MOTORS. Сезонная замена, балансировка. Независимый сервис, не дилер ${c.brand}.`,
          `Photo: real ${c.label} work at BESS MOTORS. Seasonal change, balancing. Independent shop — not a ${c.brand} dealer.`,
          `На фото — реальний сервіс ${c.label} у BESS MOTORS.`
        ),
      },
      {
        title: L("Jak umówić wizytę", "Как записаться", "How to book", "Як записатися"),
        body: L(
          "Kliknij „Umów wizytę” na tej stronie albo zadzwoń +48 791 257 229. Potwierdzimy termin po kontakcie.",
          "Нажмите «Записаться» или звоните +48 791 257 229.",
          "Tap Book a visit or call +48 791 257 229.",
          "Натисніть «Записатися» або телефонуйте +48 791 257 229."
        ),
      },
    ],
    faqExtra: [
      {
        q: L(
          `Czy robicie opony RunFlat na ${c.label}?`,
          `Делаете RunFlat на ${c.label}?`,
          `Do you fit RunFlat on ${c.label}?`,
          `Робите RunFlat на ${c.label}?`
        ),
        a: L(
          `Dopłata RunFlat wynosi ${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/koło. Przy zapisie podaj rozmiar R — potwierdzimy, czy wejdzie na maszynę.`,
          `Доплата RunFlat ${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/колесо. Размер подтверждаем при записи.`,
          `RunFlat surcharge is ${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/wheel. Tell us the size when you book so we can confirm it fits.`,
          `Доплата RunFlat ${TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/колесо. Розмір підтверджуємо при записі.`
        ),
      },
      {
        q: L("Czy jesteście ASO?", "Вы АСО / дилер?", "Are you a dealer?", "Ви дилер?"),
        a: L(
          `Nie — niezależny warsztat. Obsługujemy ${c.label} i inne modele ${c.brand}.`,
          `Нет — независимый сервис для ${c.label} и других ${c.brand}.`,
          `No — independent workshop for ${c.label} and other ${c.brand} models.`,
          `Ні — незалежний сервіс.`
        ),
      },
    ],
  };
}

function brakeProfile(c: ModelServiceCase): SlugLandingProfile {
  const front = getPriceItem("brake_pads_front")?.basePrice ?? 100;
  return {
    bookServiceId: "brakePads",
    contentServiceId: "brakePads",
    galleryTags: [...c.galleryTags, "hamulc", "brake", "klock"],
    faqDuration: L(
      `Wymiana klocków ${c.label}: zwykle 1–2 godziny — zależnie od przód/tył i tarcz.`,
      `Замена колодок ${c.label}: обычно 1–2 часа.`,
      `${c.label} pad change: usually 1–2 hours.`,
      `Заміна колодок ${c.label}: зазвичай 1–2 години.`
    ),
    price: {
      fromZl: front,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        `Robocizna klocków z kodem BessMotors — od ${front} zł (przód). Części dobieramy pod VIN ${c.label}. Wycena przed montażem.`,
        `Работа по коду BessMotors — от ${front} zł. Запчасти под VIN ${c.label}.`,
        `Labour with BessMotors code — from ${front} zł. Parts by ${c.label} VIN.`,
        `Робота за кодом BessMotors — від ${front} zł.`
      ),
      includes: [
        L("Demontaż zużytych klocków, montaż nowych", "Снятие старых, установка новых", "Remove old pads, fit new", "Зняття старих, монтаж нових"),
        L("Kontrola tarcz i prowadnic", "Проверка дисков и направляющих", "Disc and guide check", "Перевірка дисків"),
      ],
    },
    education: [
      {
        title: L(
          `Hamulce ${c.label} w BESS MOTORS`,
          `Тормоза ${c.label} в BESS MOTORS`,
          `${c.label} brakes at BESS MOTORS`,
          `Гальма ${c.label} у BESS MOTORS`
        ),
        body: L(
          `Serwisujemy hamulce ${c.label}: klocki, tarcze, płyn. Na stronie wulkanizacji tego modelu zobaczysz realne zdjęcie z warsztatu. Niezależny warsztat — nie ASO ${c.brand}.`,
          `Обслуживаем тормоза ${c.label}. На странице шиномонтажа этой модели — реальное фото сервиса.`,
          `We service ${c.label} brakes. See the tyre page for a real workshop photo of this model.`,
          `Обслуговуємо гальма ${c.label}.`
        ),
      },
      {
        title: L("Kiedy wymieniać klocki", "Когда менять колодки", "When to change pads", "Коли міняти колодки"),
        body: L(
          "Piszczenie, wibracje, dłuższa droga hamowania, kontrolka zużycia — nie czekaj. Po diagnostyce pokazujemy zużycie i akceptujesz zakres.",
          "Скрип, вибрации, длинный тормозной путь — не ждите.",
          "Squeal, vibration, longer stopping distance — don’t wait.",
          "Скрип, вібрації — не чекайте."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy części dobieracie po VIN?", "Подбираете по VIN?", "Parts by VIN?", "Підбираєте за VIN?"),
        a: L(
          `Tak — dla ${c.label} dobieramy klocki/tarcze po VIN i potwierdzamy cenę przed montażem.`,
          `Да — для ${c.label} подбор по VIN.`,
          `Yes — ${c.label} pads/discs by VIN.`,
          `Так — підбір за VIN.`
        ),
      },
    ],
  };
}

export const EXTRA_SEO_SERVICE_PAGES_BATCH5: SeoLandingPage[] = MODEL_SERVICE_CASES.flatMap((c) => [
  tirePage(c),
  brakePage(c),
]);

export const EXTRA_SEO_SERVICE_PROFILES_BATCH5: Record<string, SlugLandingProfile> =
  Object.fromEntries(
    MODEL_SERVICE_CASES.flatMap((c) => [
      [c.tireSlug, tireProfile(c)],
      [c.brakeSlug, brakeProfile(c)],
    ])
  );

export const EXTRA_SEO_RELATED_BATCH5: Record<string, string[]> = Object.fromEntries(
  MODEL_SERVICE_CASES.flatMap((c) => {
    const otherTires = MODEL_SERVICE_CASES.filter((x) => x.id !== c.id)
      .slice(0, 2)
      .map((x) => x.tireSlug);
    return [
      [
        c.tireSlug,
        [
          c.brakeSlug,
          "sezonowa-wymiana-opon-warszawa",
          "wulkanizacja-warszawa",
          "wymiana-opon-warszawa",
          c.brandHubSlug,
          "wywazanie-kol-warszawa",
          ...otherTires,
        ],
      ],
      [
        c.brakeSlug,
        [
          c.tireSlug,
          "wymiana-klockow-hamulcowych-warszawa",
          "hamulce-warszawa",
          "hamulce",
          c.brandHubSlug,
          "wymiana-tarcz-hamulcowych-warszawa",
        ],
      ],
    ];
  })
);

/** Cross-link brand hubs → model tire pages */
export const EXTRA_SEO_RELATED_PARENT_UPDATES_BATCH5: Record<string, string[]> = {
  bmw: [
    "wymiana-opon-bmw-7-g70-warszawa",
    "wymiana-opon-bmw-x3-warszawa",
    "wymiana-opon-bmw-warszawa",
    "wymiana-klockow-hamulcowych-bmw-warszawa",
  ],
  mercedes: ["wymiana-opon-mercedes-warszawa", "wymiana-klockow-hamulcowych-mercedes-warszawa"],
  "serwis-audi": [
    "wymiana-opon-audi-q5-warszawa",
    "wymiana-klockow-hamulcowych-audi-q5-warszawa",
    "vag",
  ],
  "wulkanizacja-warszawa": [
    "wymiana-opon-audi-q5-warszawa",
    "wymiana-opon-bmw-7-g70-warszawa",
    "wymiana-opon-bmw-x3-warszawa",
  ],
  "sezonowa-wymiana-opon-warszawa": [
    "wymiana-opon-audi-q5-warszawa",
    "wymiana-opon-bmw-7-g70-warszawa",
    "wymiana-opon-mercedes-warszawa",
  ],
};
