/**
 * Original owner-provided illustrative photos for the ambient-lighting and
 * car soundproofing service galleries, received 20 November 2026.
 * Cropped / resized to WebP without inventing or altering the interiors.
 * Photo provenance is not a verified case study or workshop attribution.
 * Supplier image IMG_0947 (watermark) is intentionally excluded.
 */
export type EnhancementPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const AMBIENT_PATH = "/images/enhancements/ambient/";
const NOISE_PATH = "/images/enhancements/soundproofing/";

export const AMBIENT_LIGHTING_PHOTOS: readonly EnhancementPhoto[] = [
  { src: AMBIENT_PATH + "ambient-08.webp", alt: "Wielokolorowe oświetlenie ambientowe deski rozdzielczej i konsoli samochodu", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-04.webp", alt: "Fioletowo-różowa listwa LED na desce rozdzielczej i drzwiach", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-18.webp", alt: "Fioletowe oświetlenie nastrojowe wnętrza i tylnych foteli", width: 960, height: 1280 },
  { src: AMBIENT_PATH + "ambient-13.webp", alt: "Indywidualnie zamontowane ambient LED w kokpicie samochodu", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-07.webp", alt: "Różowe oświetlenie ambientowe na drzwiach i w tylnej części kabiny", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-01.webp", alt: "Czerwone i niebieskie oświetlenie LED deski rozdzielczej i przestrzeni na nogi", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-03.webp", alt: "Zielono-turkusowa taśma ambient na desce i drzwiach samochodu", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-05.webp", alt: "Podświetlony głośnik i dekoracyjne listwy LED we wnętrzu", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-06.webp", alt: "Różowo-fioletowe oświetlenie ambientowe boczku drzwi", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-09.webp", alt: "Kolorowe oświetlenie deski, drzwi i konsoli centralnej", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-10.webp", alt: "Fioletowe oświetlenie listwy konsoli i drzwi z przodu auta", width: 589, height: 962 },
  { src: AMBIENT_PATH + "ambient-11.webp", alt: "Niebiesko-fioletowe oświetlenie kokpitu samochodu", width: 589, height: 920 },
  { src: AMBIENT_PATH + "ambient-12.webp", alt: "Wielobarwne dekoracyjne oświetlenie na drzwiach pojazdu", width: 589, height: 1052 },
  { src: AMBIENT_PATH + "ambient-14.webp", alt: "Fioletowa listwa świetlna na desce i na boczku drzwi", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-15.webp", alt: "Niebieska podświetlana przestrzeń na nogi we wnętrzu samochodu", width: 720, height: 1046 },
  { src: AMBIENT_PATH + "ambient-16.webp", alt: "Czerwone akcenty świetlne na drzwiach i podświetlenie tylnej kabiny", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-17.webp", alt: "Niebieskie podświetlenie wnętrza przy fotelach i panelach drzwiowych", width: 720, height: 1280 },
  { src: AMBIENT_PATH + "ambient-02.webp", alt: "Dyskretne fioletowe oświetlenie tylnych drzwi i podłogi", width: 720, height: 1226 },
  { src: AMBIENT_PATH + "ambient-19.webp", alt: "Detal fioletowego podświetlenia LED na desce rozdzielczej", width: 960, height: 1280 },
];

export const SOUNDPROOFING_PHOTOS: readonly EnhancementPhoto[] = [
  { src: NOISE_PATH + "wyciszenie-02.webp", alt: "Wygłuszenie drzwi samochodu matami butylowymi, montaż warstwy antywibracyjnej", width: 746, height: 1280 },
  { src: NOISE_PATH + "wyciszenie-01.webp", alt: "Wygłuszanie i izolacja nadkola oraz wnętrza bagażnika samochodu", width: 589, height: 1052 },
  { src: NOISE_PATH + "wyciszenie-03.webp", alt: "Pianka akustyczna zamontowana od wewnętrznej strony tapicerki drzwiowej", width: 520, height: 920 },
];


/**
 * Owner-supplied BMW multimedia photos from 20 November 2026.
 * The captured in-car screen demonstrates Android Auto / Google Maps.
 * Images are illustrative of retrofit possibilities, not proof of Apple CarPlay
 * on this particular unit. Compatibility is checked against each car.
 */
const CARPLAY_PATH = "/images/enhancements/carplay/";
export const CARPLAY_ANDROID_AUTO_PHOTOS: readonly EnhancementPhoto[] = [
  { src: CARPLAY_PATH + "bmw-android-auto-cockpit.jpg", alt: "BMW z ekranem multimedialnym Android Auto oraz podświetleniem kokpitu – widok całej deski rozdzielczej", width: 1536, height: 864 },
  { src: CARPLAY_PATH + "bmw-google-maps-screen.jpg", alt: "Google Maps na ekranie BMW po integracji Android Auto – nawigacja samochodowa", width: 1536, height: 864 },
  { src: CARPLAY_PATH + "bmw-media-android-auto.jpg", alt: "Menu systemu BMW z wybraną funkcją Android Auto na fabrycznym ekranie multimedialnym", width: 864, height: 1536 },
  { src: CARPLAY_PATH + "bmw-google-maps-portrait.jpg", alt: "Wyświetlacz BMW z aktywną mapą Google Maps i interfejsem Android Auto – zdjęcie wnętrza", width: 864, height: 1536 },
];


/** Owner-provided images of a fibre-optic starlight headliner project.
 * The gallery separates loose fibre lighting tests, headliner preparation,
 * and the finished interior. Do not imply verified BESS MOTORS case ownership.
 */
const STAR_HEADLINER_PATH = "/images/enhancements/star-headliner/";
export const STAR_HEADLINER_PHOTOS: readonly EnhancementPhoto[] = [
  { src: STAR_HEADLINER_PATH + "gwiezdne-niebo-gotowy-efekt.jpg", alt: "Gotowa czarna podsufitka z rozświetlonymi punktami gwiezdnego nieba we wnętrzu samochodu", width: 864, height: 1536 },
  { src: STAR_HEADLINER_PATH + "gwiezdne-niebo-montaz-podsufitki.jpg", alt: "Przygotowanie zdemontowanej podsufitki i prowadzenie światłowodów od jej tylnej strony", width: 1152, height: 1536 },
  { src: STAR_HEADLINER_PATH + "gwiezdne-niebo-prowadzenie-wlokien.jpg", alt: "Wystające włókna światłowodowe na czarnym materiale podsufitki przed wykończeniem", width: 864, height: 1536 },
  { src: STAR_HEADLINER_PATH + "gwiezdne-niebo-test-swiatlowodow-01.jpg", alt: "Fioletowe i białe końcówki światłowodów świecące podczas testu zestawu gwiezdnego nieba", width: 1152, height: 1536 },
  { src: STAR_HEADLINER_PATH + "gwiezdne-niebo-test-swiatlowodow-02.jpg", alt: "Świecące włókna światłowodowe przed montażem w samochodowej podsufitce", width: 1152, height: 1536 },
];
