"use client";

import Link from "next/link";
import {
  ArrowRight, CalendarDays, ChevronRight, CircleHelp, Clock3,
  Disc3, Droplets, FileSearch, Gauge, MapPin, Phone,
} from "lucide-react";
import { HeroVideo } from "@/components/home/HeroVideo";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { businessConfig } from "@/lib/businessConfig";
import { WORKSHOP_DIRECTIONS_URL } from "@/lib/maps";
import { trackGetDirectionsClick } from "@/lib/gtag";

const copy = {
  pl: {
    eyebrow: "BESS MOTORS / WARSZAWA WŁOCHY",
    headline1: "Mniej zgadywania.",
    headline2: "Więcej konkretów.",
    intro: "Diagnostyka, obsługa i naprawy samochodów. Najpierw sprawdzamy problem i uzgadniamy zakres oraz cenę prac.",
    book: "Umów wizytę",
    services: "Znajdź usługę",
    quote: "Wycena po VIN",
    call: "Zadzwoń",
    directions: "Wyznacz trasę",
    hours: "Pn–Pt 09:00–18:00 · Sb 09:00–14:00",
    choose: "WYBIERZ, CZEGO POTRZEBUJESZ",
    fast: "Szybki wybór usług",
    tires: "Wymiana opon",
    oil: "Olej i filtry",
    brakes: "Hamulce",
    diagnostic: "Diagnostyka",
  },
  ru: {
    eyebrow: "BESS MOTORS / ВАРШАВА WŁOCHY",
    headline1: "Меньше догадок.",
    headline2: "Больше конкретики.",
    intro: "Диагностика, обслуживание и ремонт автомобилей. Сначала разбираемся с проблемой и согласовываем работы и стоимость.",
    book: "Записаться",
    services: "Найти услугу",
    quote: "Расчёт по VIN",
    call: "Позвонить",
    directions: "Построить маршрут",
    hours: "Пн–Пт 09:00–18:00 · Сб 09:00–14:00",
    choose: "ВЫБЕРИТЕ НУЖНУЮ УСЛУГУ",
    fast: "Быстрый выбор услуг",
    tires: "Шиномонтаж",
    oil: "Масло и фильтры",
    brakes: "Тормоза",
    diagnostic: "Диагностика",
  },
  uk: {
    eyebrow: "BESS MOTORS / ВАРШАВА WŁOCHY",
    headline1: "Менше здогадів.",
    headline2: "Більше конкретики.",
    intro: "Діагностика, обслуговування та ремонт авто. Спочатку з'ясовуємо проблему й погоджуємо роботи та вартість.",
    book: "Записатися",
    services: "Знайти послугу",
    quote: "Оцінка за VIN",
    call: "Зателефонувати",
    directions: "Прокласти маршрут",
    hours: "Пн–Пт 09:00–18:00 · Сб 09:00–14:00",
    choose: "ОБЕРІТЬ ПОТРІБНУ ПОСЛУГУ",
    fast: "Швидкий вибір послуг",
    tires: "Шиномонтаж",
    oil: "Олива й фільтри",
    brakes: "Гальма",
    diagnostic: "Діагностика",
  },
  en: {
    eyebrow: "BESS MOTORS / WARSAW WŁOCHY",
    headline1: "Less guesswork.",
    headline2: "More clarity.",
    intro: "Diagnostics, servicing and vehicle repairs. We identify the problem and agree on the scope and quote before work begins.",
    book: "Book a visit",
    services: "Find a service",
    quote: "Quote by VIN",
    call: "Call us",
    directions: "Get directions",
    hours: "Mon–Fri 09:00–18:00 · Sat 09:00–14:00",
    choose: "CHOOSE THE SERVICE YOU NEED",
    fast: "Quick service shortcuts",
    tires: "Tyres",
    oil: "Oil and filters",
    brakes: "Brakes",
    diagnostic: "Diagnostics",
  },
} as const;

export function Hero() {
  const { t, locale } = useI18n();
  const ui = copy[locale];
  const shortcuts = [
    { href: "/wymiana-opon-warszawa", icon: Gauge, title: ui.tires, number: "01" },
    { href: "/wymiana-oleju", icon: Droplets, title: ui.oil, number: "02" },
    { href: "/hamulce", icon: Disc3, title: ui.brakes, number: "03" },
    { href: "/diagnostyka-komputerowa-warszawa", icon: CircleHelp, title: ui.diagnostic, number: "04" },
  ] as const;

  return (
    <section
      className="relative isolate overflow-hidden bg-[#07090e]"
      aria-label="BESS MOTORS"
      data-testid="home-hero"
      data-hero-layout="full-bleed"
      data-hero-design="editorial-2026"
    >
      {/* Same approved BMW video. Full-bleed stage, with a readable left side. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[17%] z-0 lg:inset-y-0 lg:left-[14%] lg:right-0" data-testid="hero-background-film">
        <HeroVideo background />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden lg:block"
        aria-hidden="true"
        style={{ background: "linear-gradient(90deg,rgba(7,9,14,.995) 0%,rgba(7,9,14,.98) 16%,rgba(7,9,14,.90) 33%,rgba(7,9,14,.72) 43%,rgba(7,9,14,.12) 70%,rgba(7,9,14,.07) 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] lg:hidden"
        aria-hidden="true"
        style={{ background: "linear-gradient(180deg,rgba(7,9,14,.99) 0%,rgba(7,9,14,.96) 32%,rgba(7,9,14,.72) 57%,rgba(7,9,14,.43) 78%,rgba(7,9,14,.93) 100%)" }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[35%] bg-gradient-to-t from-[#07090e] via-[#07090e]/65 to-transparent" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[575px] w-full max-w-7xl flex-col justify-center px-4 pb-14 pt-14 sm:min-h-[620px] lg:min-h-[610px] lg:px-8 lg:pb-20 lg:pt-16">
        <div className="max-w-[720px]">
          <div className="flex items-center gap-3">
            <span className="h-px w-9 bg-[#fb4843]" aria-hidden="true" />
            <p className="font-display text-[11px] font-semibold uppercase tracking-[.18em] text-white/75 sm:text-xs">{ui.eyebrow}</p>
          </div>

          {/* Keep a crawlable, precise local-search H1 while prioritizing the actual customer message visually. */}
          <h1 className="mt-5 font-display text-sm font-medium leading-snug tracking-[.025em] text-white/75 sm:text-base">
            {t.hero.h1Short}
          </h1>
          <p
            data-testid="hero-editorial-headline"
            className="bm-hero-enter mt-4 max-w-[720px] font-display text-[clamp(2.75rem,5vw,4.5rem)] font-bold leading-[1.01] tracking-[-.035em] text-white [text-wrap:balance] [font-kerning:normal]"
          >
            <span className="block">{ui.headline1}</span>
            <span className="mt-1 block text-[#ff625c]">{ui.headline2}</span>
          </p>
          <p className="bm-hero-enter bm-hero-enter-delay mt-6 max-w-[525px] text-sm leading-[1.75] text-white/80 sm:text-base">
            {ui.intro}
          </p>

          <div className="bm-hero-enter bm-hero-enter-delay mt-8 flex flex-col gap-3 sm:flex-row">
            <BookingLink
              trackSource="hero_editorial"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-bm-red px-7 text-sm font-bold text-white shadow-[0_16px_40px_rgba(225,6,0,.24)] transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <CalendarDays size={19} aria-hidden />
              {ui.book}
              <ArrowRight size={18} aria-hidden />
            </BookingLink>
            <Link
              href="/services"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/40 bg-black/35 px-7 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:border-white/80 hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {ui.services}<ChevronRight size={18} aria-hidden />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-7 gap-y-1 text-sm font-semibold">
            <a href="#wyceń-po-vin" className="inline-flex min-h-11 items-center gap-2 text-white/80 transition-colors hover:text-white">
              <FileSearch size={17} className="text-[#ff625c]" aria-hidden />{ui.quote}
            </a>
            <PhoneLink trackSource="hero_editorial" className="inline-flex min-h-11 items-center gap-2 text-white/80 transition-colors hover:text-white">
              <Phone size={17} className="text-[#ff625c]" aria-hidden />{ui.call}
            </PhoneLink>
          </div>
        </div>
      </div>

      {/* New command dock: real service pages instead of a second address/hours strip. */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-4 lg:px-8" data-testid="hero-service-dock">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/60 sm:text-xs">{ui.choose}</p>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[.18em] text-white/35 sm:inline">BESS / SERVICES</span>
        </div>
        <nav className="grid grid-cols-2 overflow-hidden rounded-[22px] border border-white/20 bg-[#171b23]/95 shadow-[0_22px_55px_rgba(0,0,0,.40)] backdrop-blur-xl lg:grid-cols-4" aria-label={ui.fast}>
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-[108px] flex-col justify-between gap-4 border-b border-r border-white/10 p-4 transition-colors hover:bg-[#2a2228] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white sm:min-h-[118px] sm:p-5 lg:border-b-0"
            >
              <div className="flex items-center justify-between gap-2">
                <item.icon size={23} className="text-[#ff625c]" aria-hidden />
                <span className="text-[10px] font-bold tracking-[.18em] text-white/35">{item.number}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-white sm:text-base">{item.title}</span>
                <ArrowRight size={18} className="shrink-0 text-white/55 transition-transform motion-safe:group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="relative z-10 border-t border-white/10 bg-[#090c12]/85 px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 text-[11px] font-medium text-white/65 sm:text-xs">
          <span className="inline-flex items-center gap-2"><MapPin size={15} className="text-[#ff625c]" aria-hidden />{businessConfig.streetAddress}, Warszawa</span>
          <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-[#ff625c]" aria-hidden />{ui.hours}</span>
          <a href={WORKSHOP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGetDirectionsClick("hero_editorial")} className="inline-flex min-h-9 items-center gap-2 text-white transition-colors hover:text-[#ff817d] sm:ml-auto">
            {ui.directions}<ArrowRight size={15} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
