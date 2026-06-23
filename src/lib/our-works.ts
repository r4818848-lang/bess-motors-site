import type { ServiceId } from "@/lib/services-catalog";

export type OurWorkVideo = {
  id: string;
  serviceIds: ServiceId[];
  videoSrc: string;
  posterSrc: string;
  title: { pl: string; ru: string; en: string };
  description: { pl: string; ru: string; en: string };
  instagramShortcode?: string;
  instagramUrl?: string;
};

export const OUR_WORK_VIDEOS: OurWorkVideo[] = [
  {
    id: "ac-service",
    serviceIds: ["acRefill", "acRepair"],
    videoSrc: "/videos/works/ac-service.mov",
    posterSrc: "/images/works/ac-service-cover.png",
    title: {
      pl: "Serwis klimatyzacji",
      ru: "Заправка кондиционера",
      en: "AC recharge",
    },
    description: {
      pl: `Lato już się zaczęło — to najlepszy moment, żeby sprawdzić klimatyzację i uzupełnić czynnik przed upałami.

W BESS MOTORS wykonujemy:

✅ Nabijanie klimatyzacji R134a
✅ Próżniowanie układu
✅ Kontrolę szczelności
✅ Uzupełnienie oleju i barwnika w razie potrzeby
✅ Kontrolę ciśnienia przed i po serwisie

Nawet gdy klimatyzacja jeszcze chłodzi, część czynnika naturalnie ubywa — spada skuteczność chłodzenia i rośnie obciążenie sprężarki.

🚗 Obsługujemy większość samochodów osobowych.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Zapisz się wcześniej i wita lato w komforcie! ❄️☀️`,
      ru: `Лето уже началось, а значит самое время проверить систему кондиционирования и заправить её перед жаркими днями.

В BESS MOTORS выполняем:

✅ Заправку кондиционеров R134a
✅ Вакуумирование системы
✅ Проверку герметичности
✅ Долив масла и красителя при необходимости
✅ Контроль давления до и после обслуживания

Даже если кондиционер ещё работает, со временем часть хладагента уходит естественным образом, из-за чего снижается эффективность охлаждения и увеличивается нагрузка на компрессор.

🚗 Заправляем большинство легковых автомобилей.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Запишитесь заранее и встречайте лето с комфортом! ❄️☀️`,
      en: `Summer is here — the right time to check your A/C and recharge before the heat.

At BESS MOTORS we offer:

✅ R134a refrigerant recharge
✅ System vacuum
✅ Leak check
✅ Oil and dye top-up when needed
✅ Pressure check before and after service

Even if the A/C still cools, refrigerant slowly leaks over time — cooling gets weaker and the compressor works harder.

🚗 We service most passenger cars.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Book ahead and enjoy summer in comfort! ❄️☀️`,
    },
    instagramShortcode: "DZ8LHh8KZXS",
    instagramUrl:
      "https://www.instagram.com/reel/DZ8LHh8KZXS/?utm_source=ig_web_copy_link",
  },
];

export function getOurWorkVideosForService(serviceId: ServiceId): OurWorkVideo[] {
  return OUR_WORK_VIDEOS.filter((work) => work.serviceIds.includes(serviceId));
}

export function getOurWorkVideoById(id: string): OurWorkVideo | undefined {
  return OUR_WORK_VIDEOS.find((work) => work.id === id);
}
