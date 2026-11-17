"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleHelp, FileSearch, ListFilter, ReceiptText } from "lucide-react";
import { BookingLink } from "@/components/analytics/BookingLink";
import { useI18n } from "@/lib/i18n/context";

const copy = {
  pl: {
    eyebrow: "Bez szukania po całej stronie",
    heading: "Co chcesz dzisiaj załatwić?",
    byService: "Wybierz usługę",
    byServiceDesc: "Olej, opony, hamulce, diagnostyka",
    bySymptom: "Opisz objaw",
    bySymptomDesc: "Stuki, kontrolki i inne problemy",
    pricing: "Sprawdź ceny",
    pricingDesc: "Cennik robocizny i usług",
    appointment: "Umów wizytę",
    appointmentDesc: "Wybierz termin online",
  },
  ru: {
    eyebrow: "Никаких сложных меню",
    heading: "Что вы хотите сделать?",
    byService: "Выбрать услугу",
    byServiceDesc: "Масло, шины, тормоза, диагностика",
    bySymptom: "Найти по симптому",
    bySymptomDesc: "Стук, лампы и другие проблемы",
    pricing: "Посмотреть цены",
    pricingDesc: "Прайс работ и услуг",
    appointment: "Записаться",
    appointmentDesc: "Выберите дату и время",
  },
  uk: {
    eyebrow: "Без складних меню",
    heading: "Що вам потрібно?",
    byService: "Обрати послугу",
    byServiceDesc: "Олива, шини, гальма, діагностика",
    bySymptom: "Знайти за симптомом",
    bySymptomDesc: "Стуки, індикатори та інші проблеми",
    pricing: "Переглянути ціни",
    pricingDesc: "Прайс на роботи й послуги",
    appointment: "Записатися",
    appointmentDesc: "Оберіть дату й час",
  },
  en: {
    eyebrow: "No complicated menus",
    heading: "What can we help with?",
    byService: "Choose a service",
    byServiceDesc: "Oil, tyres, brakes and diagnostics",
    bySymptom: "Find by symptom",
    bySymptomDesc: "Noises, warning lights and more",
    pricing: "Explore prices",
    pricingDesc: "Service and labour price list",
    appointment: "Book a visit",
    appointmentDesc: "Choose your date and time",
  },
} as const;

export function HomeQuickPaths() {
  const { locale } = useI18n();
  const c = copy[locale];
  const paths = [
    { href: "/services", title: c.byService, desc: c.byServiceDesc, icon: ListFilter },
    { href: "#objawy", title: c.bySymptom, desc: c.bySymptomDesc, icon: CircleHelp },
    { href: "/cennik", title: c.pricing, desc: c.pricingDesc, icon: ReceiptText },
  ] as const;
  return (
    <section className="relative z-10 border-b border-white/10 bg-[#11151c] py-8 sm:py-12" aria-labelledby="home-quick-choices">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fd8784]">{c.eyebrow}</p>
            <h2 id="home-quick-choices" className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-[2.2rem]">{c.heading}</h2>
          </div>
          <FileSearch size={25} className="hidden text-white/30 sm:block" aria-hidden />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {paths.map((item, index) => (
            <Link key={item.href} href={item.href} className="group flex min-h-[136px] flex-col justify-between gap-4 rounded-2xl border border-white/[0.11] bg-[#1c2028] p-4 transition-colors hover:border-bm-red/60 hover:bg-[#262a34] sm:p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.08] text-[#ff6963]"><item.icon size={21} aria-hidden /></span>
                <span className="text-[10px] font-bold tracking-[0.18em] text-white/35">0{index + 1}</span>
              </div>
              <div>
                <p className="flex items-center gap-1 text-sm font-bold text-white sm:text-base">{item.title}<ArrowUpRight size={15} className="shrink-0 text-white/45 group-hover:text-[#ff6963]" aria-hidden /></p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{item.desc}</p>
              </div>
            </Link>
          ))}
          <BookingLink href="/booking" trackSource="home_path_booking" className="group flex min-h-[136px] flex-col justify-between gap-4 rounded-2xl border border-bm-red/60 bg-gradient-to-br from-[#d90904] to-[#8c0707] p-4 text-white shadow-[0_15px_30px_rgba(225,6,0,.14)] transition-colors hover:from-[#ef1910] hover:to-[#a20707] sm:p-5">
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><CalendarDays size={21} aria-hidden /></span>
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/65">04</span>
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm font-bold sm:text-base">{c.appointment}<ArrowUpRight size={15} aria-hidden /></p>
              <p className="mt-1 text-xs leading-relaxed text-white/75">{c.appointmentDesc}</p>
            </div>
          </BookingLink>
        </div>
      </div>
    </section>
  );
}
