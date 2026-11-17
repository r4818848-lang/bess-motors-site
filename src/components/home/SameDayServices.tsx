"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight, Circle, Cog, Cpu, Disc, Droplets, Gauge, Snowflake } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { OIL_CHANGE_PROMO_BOOKING_ITEMS, getOilBrakePromoOffer } from "@/lib/oil-brake-promo";
import { buildBookingUrl } from "@/lib/booking-url";
import { oilLabourPromoZl } from "@/lib/service-prices";
import { TIRE_AD_LANDING_PATH, TIRE_AUDI_Q5_SRC } from "@/lib/tire-media";
import { TIRE_PROMO_FROM_ZL } from "@/lib/tire-promo-prices";

/**
 * Premium service navigation: the highest-intent services are discoverable
 * through real workshop visuals and indexable internal links. Booking remains
 * a separate tracked action. Avoid promises about same-day availability.
 */
export function SameDayServices() {
  const { t, locale } = useI18n();
  const h = t.homeLead;
  const ui = {
    pl: { brakes: "Hamulce", tires: "Z wyważaniem", labour: "Robocizna — części osobno", oil: "Olej i filtr osobno", details: "Zobacz zakres i cenę", note: "Cenę końcową uzgodnimy przed wykonaniem usługi." },
    ru: { brakes: "Тормоза", tires: "С балансировкой", labour: "Работа — запчасти отдельно", oil: "Масло и фильтр отдельно", details: "Подробнее об услуге", note: "Итоговую стоимость согласуем до работ." },
    uk: { brakes: "Гальма", tires: "З балансуванням", labour: "Робота — запчастини окремо", oil: "Олива та фільтр окремо", details: "Докладніше", note: "Кінцеву ціну погодимо до виконання робіт." },
    en: { brakes: "Brakes", tires: "Balancing included", labour: "Labour only, parts extra", oil: "Oil and filter extra", details: "Service details", note: "We agree on the total price before work begins." },
  }[locale];

  const featured = [
    {
      title: h.sameDayTires,
      label: "01 / OPONY",
      photo: TIRE_AUDI_Q5_SRC,
      alt: "Wymiana opon Audi Q5 w warsztacie BESS MOTORS w Warszawie",
      href: "/wymiana-opon-warszawa",
      bookingHref: TIRE_AD_LANDING_PATH + "#zapis-opony",
      price: "od " + TIRE_PROMO_FROM_ZL + " zł / komplet",
      priceDetail: ui.tires,
      source: "premium_tires",
      icon: Circle,
    },
    {
      title: h.sameDayOil,
      label: "02 / OLEJ",
      photo: "/images/works/oil-change-drain.png",
      alt: "Serwis olejowy — wymiana oleju silnikowego w BESS MOTORS",
      href: "/wymiana-oleju",
      bookingHref: buildBookingUrl([...OIL_CHANGE_PROMO_BOOKING_ITEMS]),
      price: oilLabourPromoZl() + " zł / robocizna",
      priceDetail: ui.oil,
      source: "premium_oil",
      icon: Droplets,
    },
    {
      title: ui.brakes,
      label: "03 / HAMULCE",
      photo: "/images/works/brake-pads-change.png",
      alt: "Wymiana klocków hamulcowych w serwisie BESS MOTORS Warszawa",
      href: "/hamulce",
      bookingHref: buildBookingUrl(["brake_pads_front"]),
      price: "od " + (getOilBrakePromoOffer("brake_pads_front")?.nowZl ?? 100) + " zł / robocizna",
      priceDetail: ui.labour,
      source: "premium_brakes",
      icon: Disc,
    },
  ] as const;

  const more = [
    { title: h.sameDayDiag, href: "/diagnostyka-komputerowa-warszawa", icon: Cpu },
    { title: h.sameDayAc, href: "/klimatyzacja", icon: Snowflake },
    { title: "Zawieszenie", href: "/naprawa-zawieszenia-warszawa", icon: Gauge },
    { title: h.sameDayTiming, href: "/wymiana-rozrzadu-warszawa", icon: Cog },
    { title: h.sameDayClutch, href: "/wymiana-sprzegla-warszawa", icon: Cog },
  ] as const;

  return (
    <section
      className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#101116] via-[#0b0c10] to-bm-black py-14 sm:py-20"
      aria-labelledby="popular-services-heading"
    >
      <div className="pointer-events-none absolute -right-28 top-4 h-80 w-80 rounded-full bg-bm-red/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bm-red">
              Warszawa Włochy · Aleja Krakowska 48/52
            </p>
            <h2 id="popular-services-heading" className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {h.popularTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bm-muted sm:text-base">
              {h.sameDaySubtitle}
            </p>
          </div>
          <Link href="/services" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:border-bm-red/50 hover:bg-white/5">
            {h.allServices}<ChevronRight size={17} aria-hidden />
          </Link>
        </div>

        <ul className="mt-9 grid gap-4 md:grid-cols-3">
          {featured.map((item) => (
            <li key={item.href} className="bm-premium-card group flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-white/15 bg-[#171a22] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:border-bm-red/60">
              <Link href={item.href} className="relative isolate block aspect-[5/4] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-bm-red" aria-label={item.title + " — " + ui.details}>
                <Image
                  src={item.photo}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 31vw, (min-width: 768px) 45vw, 100vw"
                  className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-[#08090c]/20 to-transparent" aria-hidden />
                <span className="absolute left-5 top-5 rounded-md border border-white/25 bg-black/70 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-white/90">
                  {item.label}
                </span>
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
                  <h3 className="font-display text-2xl font-bold leading-tight text-white sm:text-[1.65rem]">{item.title}</h3>
                  <span className="rounded-full border border-white/30 bg-black/50 p-2 text-white" aria-hidden>
                    <ChevronRight size={19} />
                  </span>
                </div>
              </Link>
              <div className="flex flex-1 items-center justify-between gap-2 border-t border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{item.price}</p>
                  <p className="mt-1 text-xs text-bm-label">{item.priceDetail}</p>
                </div>
                <BookingLink
                  href={item.bookingHref}
                  trackSource={item.source}
                  className="bm-btn-primary inline-flex min-h-10 shrink-0 items-center gap-1.5 px-3 text-xs font-bold"
                >
                  <CalendarDays size={14} aria-hidden />
                  {h.sameDayBook}
                </BookingLink>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-bm-label">{ui.note}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {more.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="bm-premium-card flex min-h-[78px] items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1d25] px-4 text-sm font-semibold text-white hover:border-bm-red/50 hover:bg-bm-red/5">
                <item.icon className="h-5 w-5 shrink-0 text-bm-red" aria-hidden />
                <span className="flex-1">{item.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-bm-label" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
