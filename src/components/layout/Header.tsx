"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CalendarDays, CarFront, ChevronDown, CircleHelp, Clock3, FileText, MapPin, Menu, MessageCircle, Phone, Search, Settings2, ShieldCheck, Wrench, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "@/components/brand/Logo";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { workshopWhatsAppChatUrl } from "@/lib/chat-cta";
import { businessConfig } from "@/lib/businessConfig";
import { WORKSHOP_DIRECTIONS_URL } from "@/lib/maps";
import { trackGetDirectionsClick } from "@/lib/gtag";

type ServiceGroup = "quick" | "repair" | "diagnostics";

const serviceCatalog = [
  { key: "tires", href: "/wymiana-opon-warszawa", group: "quick", search: "wulkanizacja opony koła zimowe letnie шиномонтаж резина tire tyres wheels" },
  { key: "oil", href: "/wymiana-oleju", group: "quick", search: "olej silnikowy filtr масло oil change service" },
  { key: "brakePads", href: "/hamulce", group: "quick", search: "hamulce tarcze klocki тормоза скрип brake pads discs" },
  { key: "acRefill", href: "/klimatyzacja", group: "quick", search: "klimatyzacja czynnik freon кондиционер заправка ac air conditioning" },
  { key: "diagnostic", href: "/diagnostyka-komputerowa-warszawa", group: "diagnostics", search: "diagnostyka komputer obd błędy check engine диагностика ошибки" },
  { key: "suspension", href: "/naprawa-zawieszenia-warszawa", group: "repair", search: "zawieszenie stuki wahacze amortyzatory подвеска стук arms" },
  { key: "timingBelt", href: "/wymiana-rozrzadu-warszawa", group: "repair", search: "rozrząd pasek łańcuch грм цепь ремень timing belt chain" },
  { key: "clutch", href: "/wymiana-sprzegla-warszawa", group: "repair", search: "sprzęgło dwumasa сцепление маховик clutch flywheel" },
  { key: "transmission", href: "/wymiana-oleju-skrzynia-automatyczna-warszawa", group: "repair", search: "automat dsg atf skrzynia масло акпп коробка передач gearbox" },
  { key: "engine", href: "/silnik", group: "repair", search: "silnik naprawa wyciek двигатель мотор engine repair" },
  { key: "electric", href: "/elektryka", group: "diagnostics", search: "elektryka alternator rozrusznik электрика стартер generator" },
  { key: "acRepair", href: "/naprawa-klimatyzacji", group: "repair", search: "naprawa klimatyzacji sprężarka wyciek кондиционер компрессор" },
  { key: "turbo", href: "/wymiana-turbosprezarki-warszawa", group: "repair", search: "turbo turbosprężarka турбина turbocharger" },
  { key: "otherReason", href: "/diagnostyka-przed-zakupem-warszawa", group: "diagnostics", search: "przed zakupem sprawdzenie auta przed kupnem проверка перед покупкой" },
] as const satisfies ReadonlyArray<{ key: string; href: string; group: ServiceGroup; search: string }>;

const auxiliaryLinks = [
  { href: "/cennik", key: "priceList" },
  { href: "/gallery?tab=works", key: "gallery" },
  { href: "/about", key: "about" },
  { href: "/contacts", key: "contacts" },
] as const;

const uiCopy: Record<Locale, {
  finder: string; finderHint: string; popular: string; noResults: string;
  groupQuick: string; groupRepair: string; groupDiagnostics: string;
  allServices: string; practical: string; message: string; openMenu: string; close: string;
  showRoute: string; address: string; catalogue: string; startHere: string; fastLinks: string;
}> = {
  pl: {
    finder: "Znajdź usługę", finderHint: "Wpisz usługę lub objaw, np. hamulce, olej, stuki...",
    popular: "Wybierz usługę", noResults: "Nie znaleziono usługi. Opisz problem — pomożemy dobrać wizytę.",
    groupQuick: "Obsługa na co dzień", groupRepair: "Naprawy mechaniczne", groupDiagnostics: "Diagnostyka i elektryka",
    allServices: "Wszystkie usługi", practical: "Szybki dostęp", message: "Napisz na WhatsApp", openMenu: "Otwórz menu", close: "Zamknij",
    showRoute: "Wyznacz trasę", address: "Warszawa Włochy", catalogue: "Katalog usług", startHere: "Jak możemy pomóc?", fastLinks: "Przydatne linki",
  },
  ru: {
    finder: "Найти услугу", finderHint: "Напишите услугу или симптом: масло, тормоза, стук...",
    popular: "Выберите услугу", noResults: "Услуга не найдена. Опишите проблему — поможем записаться.",
    groupQuick: "Обслуживание", groupRepair: "Ремонт автомобиля", groupDiagnostics: "Диагностика и электрика",
    allServices: "Все услуги", practical: "Быстрый доступ", message: "Написать в WhatsApp", openMenu: "Открыть меню", close: "Закрыть",
    showRoute: "Построить маршрут", address: "Варшава Włochy", catalogue: "Каталог услуг", startHere: "Чем помочь?", fastLinks: "Полезные ссылки",
  },
  uk: {
    finder: "Знайти послугу", finderHint: "Введіть послугу або симптом: олива, гальма...",
    popular: "Оберіть послугу", noResults: "Послугу не знайдено. Опишіть проблему — допоможемо записатись.",
    groupQuick: "Обслуговування", groupRepair: "Ремонт автомобіля", groupDiagnostics: "Діагностика та електрика",
    allServices: "Усі послуги", practical: "Швидкий доступ", message: "Написати у WhatsApp", openMenu: "Відкрити меню", close: "Закрити",
    showRoute: "Прокласти маршрут", address: "Варшава Włochy", catalogue: "Каталог послуг", startHere: "Чим допомогти?", fastLinks: "Корисні посилання",
  },
  en: {
    finder: "Find a service", finderHint: "Search by service or symptom: brakes, oil, noise...",
    popular: "Choose a service", noResults: "No matches. Describe your problem and we'll help arrange a visit.",
    groupQuick: "Routine service", groupRepair: "Mechanical repairs", groupDiagnostics: "Diagnostics & electrical",
    allServices: "All services", practical: "Quick access", message: "Message on WhatsApp", openMenu: "Open menu", close: "Close",
    showRoute: "Get directions", address: "Warsaw Włochy", catalogue: "Service catalogue", startHere: "How can we help?", fastLinks: "Useful links",
  },
};

type Panel = "services" | "search" | "menu" | null;

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").trim();
}

export function Header() {
  const { t, locale } = useI18n();
  const copy = uiCopy[locale];
  const pathname = usePathname();
  const [panel, setPanel] = useState<Panel>(null);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setPanel(null);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (!panel) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.nav = "open";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')].filter((node) => node.getClientRects().length > 0);
      if (!items.length) return;
      if (e.shiftKey && document.activeElement === items[0]) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === items[items.length - 1]) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const autofocus = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(autofocus);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      delete document.body.dataset.nav;
    };
  }, [panel]);

  const matches = useMemo(() => {
    const q = normalize(query);
    if (!q) return serviceCatalog;
    const words = q.split(/\s+/).filter(Boolean);
    return serviceCatalog.filter((service) => {
      const haystack = normalize(t.serviceItems[service.key] + " " + service.search);
      return words.every((word) => haystack.includes(word));
    });
  }, [query, t]);

  const toggle = (next: Exclude<Panel, null>) => {
    setQuery("");
    setPanel((old) => (old === next ? null : next));
  };
  const close = () => setPanel(null);

  const headerLinkClass = "inline-flex min-h-11 items-center rounded-xl px-3 text-[13px] font-semibold text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white";
  const renderServices = (group: ServiceGroup) => matches.filter((s) => s.group === group).map((service) => (
    <Link
      key={service.href}
      href={service.href}
      onClick={close}
      className="group flex min-h-[52px] items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-sm font-medium text-white/90 transition-all hover:border-bm-red/40 hover:bg-white/[0.075] focus-visible:outline focus-visible:outline-2 focus-visible:outline-bm-red"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-bm-red" aria-hidden><Wrench size={15}/></span>
      <span className="flex-1 leading-snug">{t.serviceItems[service.key]}</span>
      <ArrowRight size={15} className="shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white" aria-hidden />
    </Link>
  ));

  return (
    <header className="fixed inset-x-0 top-0 z-[95] safe-area-pt" data-site-header>
      <div className={scrolled ? "border-b border-white/10 bg-[#0c0e13]/95 shadow-[0_10px_36px_rgba(0,0,0,.28)] backdrop-blur-xl" : "border-b border-white/[0.08] bg-[#0c0e13]/85 backdrop-blur-xl"}>
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:h-16 lg:px-8">
          <Logo size="sm" showTagline={false} />
          <span className="ml-1 hidden h-7 w-px bg-white/10 lg:block" aria-hidden />
          <span className="ml-2 hidden max-w-28 text-[10px] font-bold uppercase leading-tight tracking-[0.17em] text-white/55 lg:block">
            {copy.address}
          </span>

          <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label={copy.catalogue}>
            <button
              type="button"
              onClick={() => toggle("services")}
              aria-expanded={panel === "services"}
              aria-controls="bess-nav-panel"
              className={headerLinkClass + (panel === "services" ? " bg-white/[0.08] text-white" : "")}
              data-testid="desktop-service-menu"
            >
              {t.nav.services}<ChevronDown className="ml-1 h-4 w-4" aria-hidden />
            </button>
            {auxiliaryLinks.map((item) => (
              <Link key={item.href} href={item.href} className={headerLinkClass + (pathname === item.href.split("?")[0] ? " text-white" : "")}>
                {t.nav[item.key]}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 xl:ml-3">
            <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm font-semibold text-white/90 transition-colors hover:border-white/30 hover:bg-white/10" aria-label={copy.finder} onClick={() => toggle("search")} data-testid="header-service-search">
              <Search size={18} aria-hidden />
              <span className="hidden 2xl:inline">{copy.finder}</span>
            </button>
            <div className="hidden sm:block"><LanguageSwitcher compact /></div>
            <PhoneLink
              trackSource="header_2026"
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-white transition-colors hover:text-bm-red lg:inline-flex"
              aria-label={t.hero.ctaCall}
            >
              <Phone size={17} aria-hidden />
              <span className="hidden 2xl:inline">{businessConfig.phoneDisplay}</span>
            </PhoneLink>
            <BookingLink trackSource="header_2026" className="hidden min-h-11 items-center justify-center gap-2 rounded-xl bg-bm-red px-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(225,6,0,.22)] transition-colors hover:bg-red-700 sm:inline-flex">
              <CalendarDays size={17} aria-hidden />{t.hero.ctaBook}
            </BookingLink>
            <button
              type="button"
              onClick={() => toggle("menu")}
              aria-label={copy.openMenu}
              aria-expanded={panel === "menu"}
              aria-controls="bess-nav-panel"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white xl:hidden"
              data-testid="mobile-nav-toggle"
            >
              {panel === "menu" ? <X size={22}/> : <Menu size={22}/>}
            </button>
          </div>
        </div>
      </div>

      {mounted && panel ? createPortal(
        <div className="fixed inset-0 z-[110]" data-testid="nav-overlay">
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-label={copy.close}
          />
          <div
            ref={panelRef}
            id="bess-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label={panel === "search" ? copy.finder : copy.catalogue}
            className="absolute inset-x-0 top-[max(3.5rem,env(safe-area-inset-top))] mx-auto max-h-[calc(100dvh-3.5rem)] w-full overflow-y-auto border-t border-white/10 bg-[#101319] shadow-[0_24px_80px_rgba(0,0,0,.6)] sm:top-16 sm:max-h-[calc(100dvh-4rem)] lg:top-16 lg:max-w-6xl lg:rounded-b-[28px] lg:border lg:border-white/10"
          >
            <div className="mx-auto max-w-6xl px-4 py-5 sm:px-7 sm:py-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-bm-red">BESS MOTORS / WARSZAWA</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{panel === "search" ? copy.finder : copy.startHere}</h2>
                </div>
                <button type="button" onClick={close} aria-label={copy.close} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10" data-testid="close-nav"><X size={21}/></button>
              </div>

              <label className="relative mt-6 block" htmlFor="bess-service-query">
                <span className="sr-only">{copy.finder}</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-bm-red" size={22} aria-hidden />
                <input
                  ref={searchRef}
                  id="bess-service-query"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={copy.finderHint}
                  className="h-14 w-full rounded-2xl border border-white/20 bg-[#1c2029] pl-12 pr-12 text-base text-white outline-none transition-colors placeholder:text-white/40 focus:border-bm-red"
                  data-testid="service-finder-input"
                />
                {query ? <button onClick={() => {setQuery(""); searchRef.current?.focus();}} type="button" aria-label={copy.close} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/60 hover:text-white"><X size={18}/></button> : null}
              </label>

              {matches.length ? (
                <div className="mt-7 grid gap-7 lg:grid-cols-3">
                  {([
                    ["quick", copy.groupQuick, CarFront],
                    ["repair", copy.groupRepair, Settings2],
                    ["diagnostics", copy.groupDiagnostics, ShieldCheck],
                  ] as const).map(([group, heading, Icon]) => {
                    const groupItems = matches.filter((s) => s.group === group);
                    return groupItems.length ? (
                      <section key={group} aria-label={heading}>
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/65"><Icon className="text-bm-red" size={18}/>{heading}</h3>
                        <div className="grid gap-2">{renderServices(group)}</div>
                      </section>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/75">
                  <CircleHelp size={22} className="mb-3 text-bm-red" aria-hidden />
                  {copy.noResults}
                  <div className="mt-4"><BookingLink trackSource="finder_no_results" onClick={close} className="inline-flex rounded-lg bg-bm-red px-4 py-3 font-bold text-white">{t.hero.ctaBook}</BookingLink></div>
                </div>
              )}

              <div className="mt-7 grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">{copy.fastLinks}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/services" onClick={close} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white"><Wrench size={16} aria-hidden />{copy.allServices}</Link>
                    <Link href="/cennik" onClick={close} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white"><FileText size={16} aria-hidden />{t.nav.priceList}</Link>
                    <Link href="/gallery?tab=works" onClick={close} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white">{t.nav.gallery}</Link>
                    <Link href="/status" onClick={close} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white">{t.nav.repairStatus}</Link>
                    <Link href="/cabinet" onClick={close} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white">{t.nav.cabinet}</Link>
                    <Link href="/about" onClick={close} className="inline-flex min-h-10 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white">{t.nav.about}</Link>
                    <Link href="/contacts" onClick={close} className="inline-flex min-h-10 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white">{t.nav.contacts}</Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                  <div className="w-full sm:hidden"><LanguageSwitcher /></div>
                  <BookingLink onClick={close} trackSource="service_panel" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-bm-red px-5 font-bold text-white lg:flex-none"><CalendarDays size={17} aria-hidden/>{t.hero.ctaBook}</BookingLink>
                  <SocialContactLink kind="whatsapp" href={workshopWhatsAppChatUrl(locale)} trackSource="nav_whatsapp" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white lg:flex-none"><MessageCircle size={17} aria-hidden/>{copy.message}</SocialContactLink>
                  <a href={WORKSHOP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" onClick={() => { trackGetDirectionsClick("nav_panel"); close(); }} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white lg:flex-none"><MapPin size={17} aria-hidden/>{copy.showRoute}</a>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
                <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden/>{businessConfig.addressLine}</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 size={14} aria-hidden/>{businessConfig.workingHoursLabel}</span>
                <PhoneLink trackSource="nav_contact" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white"><Phone size={14} aria-hidden/>{businessConfig.phoneDisplay}</PhoneLink>
              </div>
            </div>
          </div>
        </div>, document.body
      ) : null}
    </header>
  );
}
