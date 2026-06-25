export type InstagramReel = {
  id: string;
  shortcode: string;
  posterSrc: string;
  title: { pl: string; ru: string; en: string };
  caption: { pl: string; ru: string; en: string };
  instagramUrl: string;
};

export const INSTAGRAM_REELS: InstagramReel[] = [
  {
    id: "ac-service",
    shortcode: "DZ8LHh8KZXS",
    posterSrc: "/images/reels/ac-service.jpg",
    title: {
      pl: "Serwis klimatyzacji",
      ru: "Заправка кондиционера",
      en: "AC recharge",
    },
    caption: {
      pl: "Podłączenie 50 zł, R134a 60 zł/100 g — przygotuj klimatyzację przed letnimi upałami.",
      ru: "Подключение 50 zł, R134a 60 zł/100 г — подготовьте кондиционер к жарким дням.",
      en: "Connection 50 PLN, R134a 60 PLN/100g — get your AC ready before the summer heat.",
    },
    instagramUrl:
      "https://www.instagram.com/reel/DZ8LHh8KZXS/?utm_source=ig_web_copy_link",
  },
  {
    id: "valve-adjustment",
    shortcode: "DZpIslgqM7J",
    posterSrc: "/images/reels/valve-adjustment.jpg",
    title: {
      pl: "Regulacja zaworów",
      ru: "Регулировка клапанов",
      en: "Valve adjustment",
    },
    caption: {
      pl: "Precyzyjna regulacja zaworów według parametrów producenta — cichsza i sprawniejsza praca silnika.",
      ru: "Точная регулировка клапанов по заводским параметрам — тише и эффективнее работает двигатель.",
      en: "Precision valve adjustment to factory specs for quieter, more efficient engine operation.",
    },
    instagramUrl:
      "https://www.instagram.com/reel/DZpIslgqM7J/?utm_source=ig_web_copy_link",
  },
  {
    id: "clutch-repair",
    shortcode: "DZsHwKRTNw4",
    posterSrc: "/images/reels/clutch-repair.jpg",
    title: {
      pl: "Naprawa sprzęgła",
      ru: "Ремонт сцепления",
      en: "Clutch repair",
    },
    caption: {
      pl: "Wymiana kompletu sprzęgła — demontaż, montaż i test po naprawie.",
      ru: "Замена комплекта сцепления — разборка, сборка и контрольный тест.",
      en: "Full clutch replacement — teardown, assembly and post-repair test.",
    },
    instagramUrl:
      "https://www.instagram.com/reel/DZsHwKRTNw4/?utm_source=ig_web_copy_link",
  },
  {
    id: "exhaust-repair",
    shortcode: "DZsIkf0TIdq",
    posterSrc: "/images/reels/exhaust-repair.jpg",
    title: {
      pl: "Układ wydechowy",
      ru: "Выхлопная система",
      en: "Exhaust system",
    },
    caption: {
      pl: "Spawanie tłumika, naprawa rury i usunięcie nieszczelności — auto znów ciche i bezpieczne.",
      ru: "Сварка глушителя, ремонт трубы и устранение шумов — авто снова тихое и надёжное.",
      en: "Muffler welding, pipe repair and leak fixes — quiet and reliable again.",
    },
    instagramUrl:
      "https://www.instagram.com/reel/DZsIkf0TIdq/?utm_source=ig_web_copy_link",
  },
];

export function instagramReelEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${shortcode}/embed`;
}
