/**
 * Licensed, temporary editorial photos from individual FREE Pexels photo pages.
 * Use solely as clearly identified illustrative thumbnails, NOT as evidence of
 * work done by BESS MOTORS. Replace entry with owner's own photo when available.
 * Pexels license reviewed 2026-11-24: https://www.pexels.com/license/
 */
export type TemporaryServicePhoto = {
  src: string;
  alt: string;
  source: string;
};

export const temporaryServicePhotos: Readonly<Record<string, TemporaryServicePhoto>> = {
  "przyciemnianie-szyb-samochodowych-warszawa": {
    src: "https://images.pexels.com/photos/31154212/pexels-photo-31154212.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja montażu folii przyciemniającej na szybie samochodu",
    source: "https://www.pexels.com/photo/man-installing-tinted-window-film-on-car-31154212/",
  },
  "pranie-tapicerki-samochodowej-warszawa": {
    src: "https://images.pexels.com/photos/5233285/pexels-photo-5233285.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja czyszczenia samochodowego fotela urządzeniem do prania tapicerki",
    source: "https://www.pexels.com/photo/a-person-deep-cleaning-a-car-seat-5233285/",
  },
  "oklejanie-samochodu-folia-warszawa": {
    src: "https://images.pexels.com/photos/10126661/pexels-photo-10126661.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja ręcznego nakładania folii winylowej na maskę samochodu",
    source: "https://www.pexels.com/photo/person-wrapping-car-hood-with-paper-10126661/",
  },
  "montaz-body-kitu-warszawa": {
    src: "https://images.pexels.com/photos/28762238/pexels-photo-28762238.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja sportowego samochodu ze zmodyfikowanym body kitem",
    source: "https://www.pexels.com/photo/stunning-mazda-rx-7-with-veilside-kit-in-garage-28762238/",
  },
  "montaz-spoilera-samochodowego-warszawa": {
    src: "https://images.pexels.com/photos/27303554/pexels-photo-27303554.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja sportowego samochodu z tylnym spoilerem",
    source: "https://www.pexels.com/photo/a-close-up-of-a-car-with-a-rear-wing-27303554/",
  },
  "montaz-ducktaila-warszawa": {
    src: "https://images.pexels.com/photos/31853144/pexels-photo-31853144.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja tylnego spoilera i stylizacji klapy bagażnika sportowego auta",
    source: "https://www.pexels.com/photo/close-up-of-sports-car-rear-spoiler-design-31853144/",
  },
  "podswietlenie-podwozia-samochodu-warszawa": {
    src: "https://images.pexels.com/photos/17716161/pexels-photo-17716161.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja podświetlenia podwozia samochodu światłem LED",
    source: "https://www.pexels.com/photo/a-white-car-parked-in-a-garage-with-lights-on-17716161/",
  },
  "usuwanie-wgniecen-bez-lakierowania-warszawa": {
    src: "https://images.pexels.com/photos/35149611/pexels-photo-35149611.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja naprawy wgniecenia elementu karoserii w warsztacie",
    source: "https://www.pexels.com/photo/auto-body-repair-in-garage-with-tools-35149611/",
  },
  "aromatyzacja-samochodu-warszawa": {
    src: "https://images.pexels.com/photos/26561324/pexels-photo-26561324.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Ilustracja zapachu samochodowego w eleganckim wnętrzu auta",
    source: "https://www.pexels.com/photo/car-air-freshener-hanging-from-a-rear-view-mirror-26561324/",
  },
};
