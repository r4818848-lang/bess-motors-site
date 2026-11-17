"use client";

import Image from "next/image";
import { Camera, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { motionKindFor, type MotionKind } from "@/components/motion/service-motion-kind";

type Media = {
  src: string;
  alt: string;
  isWorkshop?: boolean;
};

/**
 * Real BESS MOTORS photos kept in public/ (checked in the repository).
 * Category photos are illustrative of that service, not claims about a
 * particular customer's vehicle. Unknown services show the real workshop.
 * Avoid the old animated SVG car that made the landing look like a cartoon.
 */
export const SERVICE_HERO_MEDIA: Record<MotionKind, Media> = {
  tires: {
    src: "/images/works/tire-audi-q5-bess.jpg",
    alt: "Audi Q5 na wymianie opon w warsztacie BESS MOTORS w Warszawie",
  },
  oil: {
    src: "/images/works/oil-change-drain.png",
    alt: "Wymiana oleju silnikowego w BESS MOTORS — rzeczywiste zdjęcie pracy",
  },
  brakes: {
    src: "/images/works/brake-pads-change.png",
    alt: "Wymiana klocków hamulcowych w warsztacie BESS MOTORS",
  },
  diagnostic: {
    src: "/images/workshop/lift-bay.png",
    alt: "Stanowisko diagnostyki i podnośnik w warsztacie BESS MOTORS",
    isWorkshop: true,
  },
  ac: {
    src: "/images/works/ac-recharge-bmw.png",
    alt: "Serwis klimatyzacji samochodowej w BESS MOTORS",
  },
  suspension: {
    src: "/images/works/before-after/audi-a6-suspension/after/01.jpg",
    alt: "Elementy zawieszenia samochodu po naprawie w BESS MOTORS",
  },
  timing: {
    src: "/images/works/timing-belt-passat-cover.png",
    alt: "Serwis układu rozrządu w warsztacie BESS MOTORS",
  },
  engine: {
    src: "/images/works/valve-adjustment-cover.png",
    alt: "Obsługa silnika i regulacja zaworów w warsztacie BESS MOTORS",
  },
  transmission: {
    src: "/images/works/clutch-citroen-cover.png",
    alt: "Naprawa układu przeniesienia napędu w warsztacie BESS MOTORS",
  },
  electric: {
    src: "/images/works/alternator-install.png",
    alt: "Montaż alternatora i serwis elektryki samochodowej w BESS MOTORS",
  },
  fleet: {
    src: "/images/workshop/workshop-hall.png",
    alt: "Hala serwisowa warsztatu BESS MOTORS dla samochodów klientów i flot",
    isWorkshop: true,
  },
  checklist: {
    src: "/images/workshop/lift-bay.png",
    alt: "Samochód na stanowisku serwisowym BESS MOTORS",
    isWorkshop: true,
  },
  workshop: {
    src: "/images/workshop/workshop-hall.png",
    alt: "Hala warsztatu samochodowego BESS MOTORS w Warszawie",
    isWorkshop: true,
  },
};

const copy = {
  pl: { real: "Zdjęcie z naszej pracy", workshop: "Nasz warsztat", place: "Warszawa · Aleja Krakowska 48/52" },
  ru: { real: "Фото нашей работы", workshop: "Наш автосервис", place: "Варшава · Aleja Krakowska 48/52" },
  uk: { real: "Фото нашої роботи", workshop: "Наш автосервіс", place: "Варшава · Aleja Krakowska 48/52" },
  en: { real: "Photo from our workshop", workshop: "Our workshop", place: "Warsaw · Aleja Krakowska 48/52" },
} as const;

export function ServiceLandingHeroMedia({ slug, serviceId }: { slug: string; serviceId?: ServiceId }) {
  const { locale } = useI18n();
  const kind = motionKindFor(slug, serviceId);
  const media = SERVICE_HERO_MEDIA[kind];
  const label = copy[locale];

  return (
    <figure
      className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-[20px] border border-white/15 bg-[#0a0d12] sm:aspect-[5/3] lg:aspect-[4/3]"
      data-testid="service-landing-hero-media"
      data-media-kind={kind}
    >
      <Image
        src={media.src}
        alt={media.alt}
        fill
        priority
        quality={75}
        sizes="(max-width: 1024px) 100vw, 470px"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" aria-hidden />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <Camera size={13} aria-hidden />
            {media.isWorkshop ? label.workshop : label.real}
          </span>
          <span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-white/85">
            <MapPin size={12} aria-hidden />
            {label.place}
          </span>
        </div>
        <span className="shrink-0 text-[11px] font-bold tracking-[0.18em] text-white/85">BESS MOTORS</span>
      </figcaption>
    </figure>
  );
}
