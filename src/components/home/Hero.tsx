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
    <section className="relative isolate overflow-hidden bg-[#080b10] pb-12 pt-8 sm:pb-20 sm:pt-12" aria-label="BESS MOTORS">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50" aria-hidden style={{
        backgroundImage: "radial-gradient(ellipse 70% 55% at 92% 8%,rgba(225,6,0,0.11),transparent 72%),linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)",
        backgroundSize: "auto,64px 64px,64px 64px",
      }} />
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-8 xl:grid-cols-[minmax(0,0.87fr)_minmax(0,1.13fr)] xl:gap-10">
          <div className="relative z-10 max-w-2xl py-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-bm-red/25 bg-bm-red/[0.09] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.19em] text-[#ff8581] sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-bm-red" aria-hidden />
              {copy.eyebrow}
            </p>
            <h1 className="mt-6 max-w-2xl font-display text-[2.65rem] font-extrabold leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl xl:text-[4.25rem]">
              {t.hero.h1Short}
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-snug text-white/90 sm:text-xl">
              {copy.statement}
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
              {copy.steps}
            </p>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BookingLink
                trackSource="hero_redesign"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-bm-red px-6 text-sm font-bold text-white shadow-[0_12px_30px_rgba(225,6,0,0.23)] transition-colors hover:bg-red-700"
              >
                <CalendarDays size={19} aria-hidden />{t.hero.ctaBook}<ArrowRight size={18} aria-hidden />
              </BookingLink>
              <Link href="/services" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.045] px-6 text-sm font-bold text-white transition-colors hover:border-white/50 hover:bg-white/[0.085]">
                <Wrench size={19} aria-hidden />{copy.services}<ChevronRight size={18} aria-hidden />
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <a href="#wyceń-po-vin" className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white">
                <FileSearch size={16} className="text-bm-red" aria-hidden/>{copy.quote}
              </a>
              <PhoneLink trackSource="hero_redesign" className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white">
                <Phone size={16} className="text-bm-red" aria-hidden/>{t.hero.ctaCall}
              </PhoneLink>
            </div>

            <div className="mt-7 grid gap-3 border-t border-white/10 pt-5 text-xs font-semibold text-white/65 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="shrink-0 text-bm-red" aria-hidden/>{copy.before}</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="shrink-0 text-bm-red" aria-hidden/>{copy.parts}</span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-[22px] border border-white/15 bg-[#0b0b0e] shadow-[0_35px_90px_rgba(0,0,0,.55)] sm:rounded-[28px]">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#151820] px-4 py-3 sm:px-5">
                <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/65">
                  <span className="h-2 w-2 rounded-full bg-bm-red" aria-hidden />{copy.film}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">01 / 01</span>
              </div>
              <HeroVideo />
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-white/10 bg-[#13161d] px-4 py-4 sm:px-5">
                <span className="inline-flex items-center gap-2 text-xs text-white/70"><MapPin size={15} className="text-bm-red" aria-hidden/>{businessConfig.streetAddress}, Warszawa</span>
                <a href={WORKSHOP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGetDirectionsClick("hero_film")} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-white hover:text-[#ff7772]">{copy.location}<ArrowRight size={15} aria-hidden /></a>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-2 px-1 text-[11px] text-white/50">
              <span className="inline-flex items-center gap-1.5"><Clock3 size={14} aria-hidden />{copy.hours}</span>
              <span className="font-semibold tracking-wide">{businessConfig.phoneDisplay}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
