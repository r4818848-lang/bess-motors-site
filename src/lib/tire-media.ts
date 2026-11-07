/** Tire service (wulkanizacja) — video, poster and real workshop photos */

export const TIRE_SERVICE_VIDEO_SRC = "/videos/works/tire-service.mp4";
export const TIRE_SERVICE_POSTER_SRC = "/images/works/tire-service-cover.png";

/** Real BESS MOTORS tyre-service photos (owner-provided, 2026) */
export const TIRE_BMW_FRONT_SRC = "/images/works/tire-bmw-front-bess.jpg";
export const TIRE_BMW_X3_JACK_SRC = "/images/works/tire-bmw-x3-jack-bess.jpg";
export const TIRE_MERCEDES_BAY_SRC = "/images/works/tire-mercedes-bay-hex-bess.jpg";
export const TIRE_AUDI_Q5_SRC = "/images/works/tire-audi-q5-bess.jpg";
export const TIRE_BMW_7_G70_SRC = "/images/works/tire-bmw-7-g70-bess.jpg";

/** Prefer real exterior shot as primary visual for tyre landings / home block */
export const TIRE_SERVICE_HERO_SRC = TIRE_BMW_FRONT_SRC;

/** Ads / seasonal search landing — book tyre change in one click */
export const TIRE_AD_LANDING_SLUG = "sezonowa-wymiana-opon-warszawa";
export const TIRE_AD_LANDING_PATH = `/${TIRE_AD_LANDING_SLUG}`;

export const TIRE_SERVICE_IMAGE_ALT = {
  pl: "Wymiana opon — profesjonalnie i bezpiecznie BESS MOTORS Warszawa",
  ru: "Шиномонтаж и балансировка — BESS MOTORS Варшава",
  en: "Tire change — professional and safe at BESS MOTORS Warsaw",
} as const;

export const TIRE_SERVICE_PHOTOS: {
  src: string;
  alt: { pl: string; ru: string; en: string };
}[] = [
  {
    src: TIRE_AUDI_Q5_SRC,
    alt: {
      pl: "Audi Q5 — wymiana opon BESS MOTORS Warszawa Włochy",
      ru: "Audi Q5 — шиномонтаж BESS MOTORS Варшава Włochy",
      en: "Audi Q5 tyre change at BESS MOTORS Warsaw Włochy",
    },
  },
  {
    src: TIRE_BMW_7_G70_SRC,
    alt: {
      pl: "BMW 7 G70 — wulkanizacja BESS MOTORS, Aleja Krakowska 48/52",
      ru: "BMW 7 G70 — шиномонтаж BESS MOTORS",
      en: "BMW 7 G70 tyre service at BESS MOTORS Warsaw",
    },
  },
  {
    src: TIRE_BMW_FRONT_SRC,
    alt: {
      pl: "BMW przed serwisem BESS MOTORS — wymiana opon, Warszawa Włochy",
      ru: "BMW у сервиса BESS MOTORS — шиномонтаж, Варшава Włochy",
      en: "BMW at BESS MOTORS — tyre fitting, Warsaw Włochy",
    },
  },
  {
    src: TIRE_BMW_X3_JACK_SRC,
    alt: {
      pl: "BMW X3 M Competition — wulkanizacja przy warsztacie BESS MOTORS, Aleja Krakowska 48/52",
      ru: "BMW X3 M Competition — шиномонтаж у BESS MOTORS, Aleja Krakowska 48/52",
      en: "BMW X3 M Competition tyre service at BESS MOTORS, Aleja Krakowska 48/52",
    },
  },
  {
    src: TIRE_MERCEDES_BAY_SRC,
    alt: {
      pl: "Mercedes na stanowisku — opony sezonowe w hali BESS MOTORS Warszawa",
      ru: "Mercedes на подъёмнике — сезонные шины в зале BESS MOTORS Варшава",
      en: "Mercedes in the bay — seasonal tyres at BESS MOTORS Warsaw workshop",
    },
  },
  {
    src: TIRE_SERVICE_POSTER_SRC,
    alt: TIRE_SERVICE_IMAGE_ALT,
  },
];
