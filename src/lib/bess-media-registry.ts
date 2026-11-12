/**
 * Local BESS MOTORS media already stored in this repository.
 * Rights: files shipped with the site and referenced by our-works, workshop photos or reel posters.
 * Not stock, not generated, not scraped. Customer faces are not described as identified people.
 */
export type BessMediaRecord = {
  id: string;
  src: string;
  kind: "photo" | "video";
  service: "workshop" | "tires" | "oil" | "brakes" | "ac" | "engine" | "suspension" | "transmission" | "electric" | "exhaust";
  altPl: string;
  source: "workshop-photos" | "our-works" | "instagram-reel-poster";
};

export const BESS_MEDIA_REGISTRY: BessMediaRecord[] = [
  { id: "exterior", src: "/images/workshop/exterior.png", kind: "photo", service: "workshop", altPl: "Elewacja warsztatu BESS MOTORS", source: "workshop-photos" },
  { id: "lift-bay", src: "/images/workshop/lift-bay.png", kind: "photo", service: "workshop", altPl: "Stanowisko z podnośnikiem", source: "workshop-photos" },
  { id: "hall", src: "/images/workshop/workshop-hall.png", kind: "photo", service: "workshop", altPl: "Hala warsztatu", source: "workshop-photos" },
  { id: "tire-bmw", src: "/images/workshop/tire-service-bmw.jpg", kind: "photo", service: "tires", altPl: "Samochód przy wymianie opon", source: "workshop-photos" },
  { id: "oil-drain", src: "/images/works/oil-change-drain.png", kind: "photo", service: "oil", altPl: "Spust oleju w warsztacie", source: "our-works" },
  { id: "oil-drain-2", src: "/images/works/oil-change-drain-2.png", kind: "photo", service: "oil", altPl: "Wymiana oleju, drugi kadr", source: "our-works" },
  { id: "oil-video", src: "/videos/works/oil-change.mov", kind: "video", service: "oil", altPl: "Nagranie wymiany oleju", source: "our-works" },
  { id: "brakes-photo", src: "/images/works/brake-pads-change.png", kind: "photo", service: "brakes", altPl: "Wymiana klocków hamulcowych", source: "our-works" },
  { id: "ac-lexus", src: "/images/works/ac-recharge-lexus.png", kind: "photo", service: "ac", altPl: "Obsługa klimatyzacji", source: "our-works" },
  { id: "ac-bmw", src: "/images/works/ac-recharge-bmw.png", kind: "photo", service: "ac", altPl: "Nabijanie klimatyzacji", source: "our-works" },
  { id: "ac-video", src: "/videos/works/ac-service.mov", kind: "video", service: "ac", altPl: "Nagranie serwisu klimatyzacji", source: "our-works" },
  { id: "tire-audi", src: "/images/works/tire-audi-q5-bess.jpg", kind: "photo", service: "tires", altPl: "Wymiana opon", source: "our-works" },
  { id: "tire-video", src: "/videos/works/tire-service.mp4", kind: "video", service: "tires", altPl: "Nagranie wulkanizacji", source: "our-works" },
  { id: "timing", src: "/images/works/timing-belt-passat-cover.png", kind: "photo", service: "engine", altPl: "Wymiana rozrządu", source: "our-works" },
  { id: "valves", src: "/images/works/valve-adjustment-cover.png", kind: "photo", service: "engine", altPl: "Regulacja zaworów", source: "our-works" },
  { id: "clutch", src: "/images/works/clutch-citroen-cover.png", kind: "photo", service: "transmission", altPl: "Wymiana sprzęgła", source: "our-works" },
  { id: "alternator", src: "/images/works/alternator-install.png", kind: "photo", service: "electric", altPl: "Montaż alternatora", source: "our-works" },
  { id: "exhaust", src: "/images/works/exhaust-muffler-cover.png", kind: "photo", service: "exhaust", altPl: "Naprawa tłumika", source: "our-works" },
  { id: "suspension-before", src: "/images/works/before-after/audi-a6-suspension/before/01.jpg", kind: "photo", service: "suspension", altPl: "Zawieszenie przed naprawą", source: "our-works" },
  { id: "reel-valves", src: "/images/reels/valve-adjustment.jpg", kind: "photo", service: "engine", altPl: "Okładka nagrania regulacji zaworów", source: "instagram-reel-poster" },
  { id: "reel-clutch", src: "/images/reels/clutch-repair.jpg", kind: "photo", service: "transmission", altPl: "Okładka nagrania sprzęgła", source: "instagram-reel-poster" },
  { id: "reel-exhaust", src: "/images/reels/exhaust-repair.jpg", kind: "photo", service: "exhaust", altPl: "Okładka nagrania wydechu", source: "instagram-reel-poster" },
  { id: "reel-ac", src: "/images/reels/ac-service.jpg", kind: "photo", service: "ac", altPl: "Okładka nagrania klimatyzacji", source: "instagram-reel-poster" },
];

export function mediaForService(service: BessMediaRecord["service"]): BessMediaRecord[] {
  return BESS_MEDIA_REGISTRY.filter((item) => item.service === service);
}
