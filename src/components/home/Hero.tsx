"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock3, FileSearch, MapPin, Phone, Wrench } from "lucide-react";
import { HeroVideo } from "@/components/home/HeroVideo";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { businessConfig } from "@/lib/businessConfig";
import { WORKSHOP_DIRECTIONS_URL } from "@/lib/maps";
import { trackGetDirectionsClick } from "@/lib/gtag";

const labels = {
  pl: {
    eyebrow: "Warsztat samochodowy / Warszawa Włochy",
    statement: "Twój samochód. Jasny plan naprawy.",
    steps: "Najprościej: wybierz usługę, zapytaj o koszt i umów wizytę.",
    services: "Znajdź usługę",
    quote: "Wycena po VIN",
    before: "Wycena przed naprawą",
    parts: "Dobór części do auta",
    location: "Zobacz dojazd",
    film: "BESS MOTORS / WARSZAWA",
    hours: "Pon–Pt 09:00–18:00 · Sob 09:00–14:00",
  },
  ru: {
    eyebrow: "Автосервис / Варшава Włochy",
    statement: "Ваш автомобиль. Понятный план ремонта.",
    steps: "Выберите услугу, уточните стоимость и запишитесь.",
    services: "Найти услугу",
    quote: "Расчёт по VIN",
    before: "Смета до ремонта",
    parts: "Подбор запчастей под авто",
    location: "Как доехать",
    film: "BESS MOTORS / WARSZAWA",
    hours: "Пн–Пт 09:00–18:00 · Сб 09:00–14:00",
  },
  uk: {
    eyebrow: "Автосервіс / Варшава Włochy",
    statement: "Ваш автомобіль. Зрозумілий план ремонту.",
    steps: "Оберіть послугу, уточніть ціну та запишіться.",
    services: "Знайти послугу",
    quote: "Оцінка за VIN",
    before: "Кошторис до ремонту",
    parts: "Підбір запчастин",
    location: "Як доїхати",
    film: "BESS MOTORS / WARSZAWA",
    hours: "Пн–Пт 09:00–18:00 · Сб 09:00–14:00",
  },
  en: {
    eyebrow: "Independent workshop / Warsaw Włochy",
    statement: "Your car. A clear plan for repair.",
    steps: "Choose a service, request a quote and book a visit.",
    services: "Explore services",
    quote: "VIN-based quote",
    before: "Quote before repairs",
    parts: "Parts matched to your car",
    location: "Get directions",
    film: "BESS MOTORS / WARSZAWA",
    hours: "Mon–Fri 09:00–18:00 · Sat 09:00–14:00",
  },
} as const;

export function Hero() {
  const { t, locale } = useI18n();
  const copy = labels[locale];

  return (
    <section
      className="relative isolate flex min-h-[690px] flex-col justify-between overflow-hidden bg-[#080b10] sm:min-h-[720px] lg:min-h-[680px]"
      aria-label="BESS MOTORS"
      data-testid="home-hero"
      data-hero-layout="full-bleed"
    >
      {/* Approved film and its poster are the background, not a framed video card. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[20%] z-0 lg:inset-y-0 lg:left-[16%] lg:right-0" data-testid="hero-background-film">
        <HeroVideo background />
      </div>

      {/* On wide screens the cars remain visible to the right of the readable text. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden lg:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(8,11,16,0.99) 0%, rgba(8,11,16,0.98) 17%, rgba(8,11,16,0.91) 31%, rgba(8,11,16,0.70) 43%, rgba(8,11,16,0.16) 69%, rgba(8,11,16,0.11) 100%)",
        }}
      />
      {/* Mobile/tablet: darken the heading area; show the cars lower in the scene. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] lg:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(8,11,16,0.99) 0%, rgba(8,11,16,0.98) 26%, rgba(8,11,16,0.87) 48%, rgba(8,11,16,0.48) 75%, rgba(8,11,16,0.70) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[28%]"
        aria-hidden
        style={{ background: "linear-gradient(180deg, transparent, rgba(8,11,16,0.82))" }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-14 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-[700px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-bm-red/30 bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-[#ff8581] backdrop-blur-sm sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-bm-red" aria-hidden />
            {copy.eyebrow}
          </p>

          <h1 className="bm-hero-enter mt-6 max-w-[700px] font-display text-[2.55rem] font-extrabold leading-[1.07] tracking-[-0.047em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.55)] sm:text-[3.5rem] lg:text-[3.65rem] xl:text-[3.8rem] [text-wrap:balance]">
            {t.hero.h1Short}
          </h1>
          <p className="bm-hero-enter bm-hero-enter-delay mt-6 max-w-lg text-lg font-semibold leading-snug text-white sm:text-xl">
            {copy.statement}
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
            {copy.steps}
          </p>

          <div className="bm-hero-enter bm-hero-enter-delay mt-8 grid grid-cols-1 gap-3 sm:max-w-[550px] sm:grid-cols-2">
            <BookingLink
              trackSource="hero_redesign"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-bm-red px-5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(225,6,0,0.3)] transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <CalendarDays size={19} aria-hidden />
              {t.hero.ctaBook}
              <ArrowRight size={18} aria-hidden />
            </BookingLink>
            <Link
              href="/services"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/35 bg-black/45 px-5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:border-white/70 hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Wrench size={19} aria-hidden />
              {copy.services}
              <ChevronRight size={18} aria-hidden />
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <a
              href="#wyceń-po-vin"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-white underline decoration-white/35 underline-offset-4 hover:text-[#ff8b87]"
            >
              <FileSearch size={17} className="text-[#ff5550]" aria-hidden />
              {copy.quote}
            </a>
            <PhoneLink
              trackSource="hero_redesign"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-white underline decoration-white/35 underline-offset-4 hover:text-[#ff8b87]"
            >
              <Phone size={17} className="text-[#ff5550]" aria-hidden />
              {t.hero.ctaCall}
            </PhoneLink>
          </div>

          <div className="mt-7 grid gap-3 border-t border-white/20 pt-5 text-xs font-semibold text-white/85 sm:max-w-[550px] sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={17} className="shrink-0 text-[#ff5550]" aria-hidden />
              {copy.before}
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={17} className="shrink-0 text-[#ff5550]" aria-hidden />
              {copy.parts}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full border-t border-white/15 bg-[#0b0e14]/70 px-4 py-4 backdrop-blur-md lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 text-xs font-semibold text-white/85 sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <MapPin size={17} className="shrink-0 text-[#ff5550]" aria-hidden />
            {businessConfig.streetAddress}, Warszawa
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 size={17} className="shrink-0 text-[#ff5550]" aria-hidden />
            {copy.hours}
          </span>
          <a
            href={WORKSHOP_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGetDirectionsClick("hero_background")}
            className="inline-flex min-h-10 items-center gap-2 text-white transition-colors hover:text-[#ff8b87] sm:ml-auto"
          >
            {copy.location}
            <ArrowRight size={16} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
