"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CarFront, FileSearch, Phone, Search } from "lucide-react";
import { HeroVideo } from "@/components/home/HeroVideo";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";

const copy = {
  pl: {
    eyebrow: "SERWIS SAMOCHODOWY / WARSZAWA WŁOCHY",
    heading: "Kompleksowy serwis",
    headingSecond: "Twojego samochodu.",
    highlight: "Szybko i bez stresu.",
    description: "Diagnostyka, obsługa i naprawy samochodów w Warszawie (Włochy). Zakres i cenę prac uzgadniamy przed naprawą.",
    booking: "Umów wizytę",
    call: "Zadzwoń",
    quote: "Wycena po VIN",
    services: "Znajdź usługę",
  },
  ru: {
    eyebrow: "АВТОСЕРВИС / ВАРШАВА WŁOCHY",
    heading: "Комплексный сервис",
    headingSecond: "вашего автомобиля.",
    highlight: "Просто и понятно.",
    description: "Диагностика, обслуживание и ремонт автомобилей в Варшаве. Согласуем работы и цену до начала ремонта.",
    booking: "Записаться",
    call: "Позвонить",
    quote: "Расчёт по VIN",
    services: "Найти услугу",
  },
  uk: {
    eyebrow: "АВТОСЕРВІС / ВАРШАВА WŁOCHY",
    heading: "Комплексний сервіс",
    headingSecond: "вашого автомобіля.",
    highlight: "Зручно й зрозуміло.",
    description: "Діагностика, обслуговування та ремонт у Варшаві. Узгоджуємо роботи й ціну до ремонту.",
    booking: "Записатися",
    call: "Зателефонувати",
    quote: "Оцінка за VIN",
    services: "Знайти послугу",
  },
  en: {
    eyebrow: "CAR SERVICE / WARSAW WŁOCHY",
    heading: "Complete care",
    headingSecond: "for your vehicle.",
    highlight: "Clear and straightforward.",
    description: "Vehicle diagnostics, maintenance and repairs in Warsaw Włochy. We agree on work and price before repairs begin.",
    booking: "Book a visit",
    call: "Call us",
    quote: "VIN-based quote",
    services: "Find a service",
  },
} as const;

export function Hero() {
  const { t, locale } = useI18n();
  const ui = copy[locale];

  return (
    <section
      className="relative isolate overflow-hidden border-b border-white/10 bg-[#090b10]"
      aria-label="BESS MOTORS"
      data-testid="home-hero"
      data-hero-layout="full-bleed"
      data-hero-design="automotive-showcase-2026"
    >
      <div className="relative mx-auto max-w-[1600px]">
        <div className="relative isolate lg:min-h-[495px] xl:min-h-[550px]">
          <div className="relative z-10 mx-auto max-w-7xl px-4 pt-9 sm:pt-12 lg:px-8 lg:pt-16 xl:pt-20">
            <div className="max-w-[650px]">
              <div className="flex items-center gap-3">
                <span className="h-[2px] w-9 shrink-0 bg-bm-accent" aria-hidden />
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.19em] text-bm-copy sm:text-xs">
                  {ui.eyebrow}
                </p>
              </div>

              <h1 className="mt-4 text-[12px] font-medium leading-snug text-bm-label sm:text-sm">
                {t.hero.h1Short}
              </h1>

              <p
                data-testid="hero-editorial-headline"
                className="bm-hero-enter mt-3 font-display text-[clamp(2.05rem,5vw,3.55rem)] font-bold leading-[1.05] tracking-[-0.03em] text-bm-heading [text-wrap:balance]"
              >
                <span className="block">{ui.heading}</span>
                <span className="block">{ui.headingSecond}</span>
                <span className="mt-1 block text-bm-accent">{ui.highlight}</span>
              </p>

              <p className="bm-hero-enter bm-hero-enter-delay mt-5 max-w-[480px] text-sm leading-relaxed text-bm-copy sm:text-base">
                {ui.description}
              </p>
            </div>
          </div>

          {/* One approved film on all breakpoints. Mobile reserves a 16:9 frame,
              so the left, centre and right BMW all remain within view. */}
          <div
            className="relative z-0 mt-3 aspect-video w-full overflow-hidden bg-[#07090e] lg:absolute lg:inset-y-0 lg:left-[36%] lg:right-0 lg:mt-0 lg:aspect-auto lg:w-auto"
            data-testid="hero-background-film"
            data-cars-visible="three"
          >
            <HeroVideo background />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080a0f]/10 via-transparent to-[#080a0f]/30 lg:hidden" aria-hidden />
            <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#090b10] via-[#090b10]/35 to-transparent lg:block" aria-hidden />
          </div>
        </div>

        {/* Four large thumb-friendly calls to action, arranged 2×2 on mobile. */}
        <nav
          aria-label={ui.booking}
          className="relative z-20 mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 pb-7 pt-3 sm:gap-3 sm:pb-10 lg:grid-cols-4 lg:px-8 lg:pt-0"
          data-testid="hero-quick-actions"
        >
          <BookingLink
            trackSource="hero_showcase_booking"
            className="bm-btn-primary group flex min-h-[64px] items-center justify-center gap-2 px-2 py-3 text-center text-[13px] font-bold sm:min-h-[66px] sm:gap-3 sm:px-4 sm:text-base"
          >
            <CalendarDays size={21} className="shrink-0" aria-hidden />
            <span>{ui.booking}</span>
            <ArrowRight size={17} className="hidden shrink-0 sm:block" aria-hidden />
          </BookingLink>

          <PhoneLink
            trackSource="hero_showcase_call"
            className="bm-btn-secondary flex min-h-[64px] items-center justify-center gap-2 px-2 py-3 text-center text-[13px] font-bold sm:min-h-[66px] sm:gap-3 sm:px-4 sm:text-base"
          >
            <Phone size={21} className="shrink-0 text-bm-accent" aria-hidden />
            <span>{ui.call}</span>
          </PhoneLink>

          <a
            href="#wyceń-po-vin"
            className="bm-btn-secondary flex min-h-[64px] items-center justify-center gap-2 px-2 py-3 text-center text-[13px] font-bold sm:min-h-[66px] sm:gap-3 sm:px-4 sm:text-base"
          >
            <FileSearch size={21} className="shrink-0 text-bm-accent" aria-hidden />
            <span>{ui.quote}</span>
          </a>

          <Link
            href="/services"
            className="bm-btn-secondary flex min-h-[64px] items-center justify-center gap-2 px-2 py-3 text-center text-[13px] font-bold sm:min-h-[66px] sm:gap-3 sm:px-4 sm:text-base"
          >
            <Search size={21} className="shrink-0 text-bm-accent" aria-hidden />
            <span>{ui.services}</span>
            <ArrowRight size={16} className="hidden shrink-0 sm:block" aria-hidden />
          </Link>
        </nav>
      </div>
    </section>
  );
}
