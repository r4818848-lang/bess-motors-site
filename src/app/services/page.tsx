"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, ChevronDown, CircleHelp, FileText, MapPin, Search, Wrench } from "lucide-react";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import type { ServiceId } from "@/lib/services-catalog";
import { LazySmartBookingModal } from "@/components/booking/LazySmartBookingModal";
import { BookingLink } from "@/components/analytics/BookingLink";
import { useMetaViewContent } from "@/hooks/useMetaViewContent";
import { createCallRequest } from "@/lib/booking-actions";
import { normalizePhone } from "@/lib/auth";
import { saveSubmissionSnapshot, THANK_YOU_PATH } from "@/lib/submission-thank-you";
import { EXTRA_SEO_SERVICE_PAGES } from "@/lib/seo-extra-service-pages";
import { businessConfig } from "@/lib/businessConfig";
import { trackBookingOpen } from "@/lib/gtag";

type Group = "popular" | "repairs" | "diagnostics";

const catalogue = [
  { serviceId: "tires", titleKey: "tires", icon: "Circle", href: "/wymiana-opon-warszawa", group: "popular", keywords: "opony koła wulkanizacja зимняя резина шиномонтаж tyres" },
  { serviceId: "oil", titleKey: "oil", icon: "Droplets", href: "/wymiana-oleju", group: "popular", keywords: "olej filtr масло масло двигателя oil filter" },
  { serviceId: "brakePads", titleKey: "brakePads", icon: "Disc", href: "/hamulce", group: "popular", keywords: "hamulce klocki tarcze тормоза колодки brake pads" },
  { serviceId: "acRefill", titleKey: "acRefill", icon: "Wind", href: "/klimatyzacja", group: "popular", keywords: "klimatyzacja фреон кондиционер ac freon" },
  { serviceId: "suspension", titleKey: "suspension", icon: "Settings", href: "/naprawa-zawieszenia-warszawa", group: "repairs", keywords: "stuki wahacze tuleje амортизаторы подвеска suspension" },
  { serviceId: "timingBelt", titleKey: "timingBelt", icon: "Cog", href: "/wymiana-rozrzadu-warszawa", group: "repairs", keywords: "rozrząd pasek łańcuch грм цепь timing" },
  { serviceId: "clutch", titleKey: "clutch", icon: "Settings", href: "/wymiana-sprzegla-warszawa", group: "repairs", keywords: "sprzęgło dwumasa сцепление clutch" },
  { serviceId: "transmission", titleKey: "transmission", icon: "Settings", href: "/wymiana-oleju-skrzynia-automatyczna-warszawa", group: "repairs", keywords: "automat dsg atf skrzynia акпп коробка передач" },
  { serviceId: "engine", titleKey: "engine", icon: "Cog", href: "/silnik", group: "repairs", keywords: "silnik wyciek двигатель мотор engine" },
  { serviceId: "acRepair", titleKey: "acRepair", icon: "Wind", href: "/naprawa-klimatyzacji", group: "repairs", keywords: "sprężarka przewody klima компрессор кондиционер" },
  { serviceId: "diagnostic", titleKey: "diagnostic", icon: "ScanLine", href: "/diagnostyka-komputerowa-warszawa", group: "diagnostics", keywords: "diagnostyka obd check engine ошибки диагностика" },
  { serviceId: "electric", titleKey: "electric", icon: "Zap", href: "/elektryka", group: "diagnostics", keywords: "elektryka alternator rozrusznik стартер электрика" },
] as const satisfies ReadonlyArray<{ serviceId: ServiceId; titleKey: string; icon: string; href: string; group: Group; keywords: string }>;

const labels: Record<Locale, {
  eyebrow: string; title: string; intro: string; search: string; all: string; popular: string;
  repairs: string; diagnostics: string; details: string; booking: string; more: string;
  help: string; noMatch: string; other: string; additional: string; cta: string;
}> = {
  pl: {
    eyebrow: "BESS MOTORS / katalog usług", title: "Wybierz usługę bez zgadywania",
    intro: "Wybierz kategorię, wyszukaj usługę albo opisz objawy. Przed rozpoczęciem prac uzgadniamy wycenę.",
    search: "Szukaj usługi, np. olej, hamulce, stuki, DSG...", all: "Wszystkie",
    popular: "Codzienny serwis", repairs: "Naprawy mechaniczne", diagnostics: "Diagnostyka",
    details: "Szczegóły", booking: "Umów", more: "Więcej usług i napraw",
    help: "Nie wiesz, czego potrzebuje auto?", noMatch: "Nie znaleziono tej nazwy. Opisz problem — pomożemy ustalić kolejne kroki.",
    other: "Opisz problem", additional: "Pozostałe usługi", cta: "Umów termin",
  },
  ru: {
    eyebrow: "BESS MOTORS / каталог услуг", title: "Быстро найдите нужную услугу",
    intro: "Выберите категорию, найдите услугу или опишите симптомы. Стоимость согласуем до ремонта.",
    search: "Поиск: масло, тормоза, стук, DSG...", all: "Все",
    popular: "Обслуживание", repairs: "Ремонт", diagnostics: "Диагностика",
    details: "Подробнее", booking: "Записаться", more: "Другие работы",
    help: "Не знаете, что нужно автомобилю?", noMatch: "Не нашли услугу. Опишите проблему — поможем подобрать следующий шаг.",
    other: "Опишите проблему", additional: "Остальные услуги", cta: "Записаться",
  },
  uk: {
    eyebrow: "BESS MOTORS / каталог послуг", title: "Швидко знайдіть потрібну послугу",
    intro: "Оберіть категорію, знайдіть послугу або опишіть симптоми. Вартість погодимо до ремонту.",
    search: "Пошук: олива, гальма, стуки, DSG...", all: "Усі",
    popular: "Обслуговування", repairs: "Ремонт", diagnostics: "Діагностика",
    details: "Докладніше", booking: "Записатися", more: "Інші роботи",
    help: "Не знаєте, що потрібно авто?", noMatch: "Не знайшли послугу. Опишіть проблему — допоможемо.",
    other: "Опишіть проблему", additional: "Інші послуги", cta: "Записатися",
  },
  en: {
    eyebrow: "BESS MOTORS / service catalogue", title: "Find the right service quickly",
    intro: "Choose a category, search for a service or describe a symptom. We agree on a quote before repairs.",
    search: "Search: oil, brakes, noise, DSG...", all: "All",
    popular: "Routine service", repairs: "Mechanical repairs", diagnostics: "Diagnostics",
    details: "Details", booking: "Book", more: "More services",
    help: "Not sure what your car needs?", noMatch: "No matching service. Describe the problem and we'll help.",
    other: "Describe the problem", additional: "Other services", cta: "Book a visit",
  },
};

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
}

export default function ServicesPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const s = t.services;
  const copy = labels[locale];
  useMetaViewContent("Services Page");

  const [category, setCategory] = useState<Group | "all">("all");
  const [query, setQuery] = useState("");
  const [bookingService, setBookingService] = useState<ServiceId | null>(null);
  const [problem, setProblem] = useState("");
  const [phone, setPhone] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [sending, setSending] = useState(false);

  const needle = normalize(query.trim());
  const matched = useMemo(() => catalogue.filter((item) => {
    const label = t.serviceItems[item.titleKey as keyof typeof t.serviceItems] ?? "";
    const q = normalize(label + " " + item.keywords);
    const matchesQuery = !needle || needle.split(/\s+/).every((word) => q.includes(word));
    return matchesQuery && (category === "all" || category === item.group);
  }), [t, needle, category]);
  const additional = useMemo(() => {
    const primary = new Set(catalogue.map((item) => item.href.slice(1)));
    return EXTRA_SEO_SERVICE_PAGES.filter((page) =>
      page.noIndex !== true &&
      page.slug !== "wymiana-oleju-warszawa" &&
      !primary.has(page.slug) &&
      (!needle || normalize(page.title + " " + page.metaTitle).includes(needle))
    );
  }, [needle]);

  const submitCustomRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizePhone(phone);
    if (!normalized || sending) return;
    setSending(true);
    setSubmitError("");
    const result = await createCallRequest({
      phone: normalized, clientName: s.customRequest, serviceId: "otherReason",
      serviceLabel: s.customRequest,
      comment: problem.trim() || s.callback.commentDefault,
      source: "services_custom_request",
    });
    setSending(false);
    if (!result.ok) {
      setSubmitError(s.requestError);
      return;
    }
    saveSubmissionSnapshot({
      kind: "call", submittedAt: new Date().toISOString(),
      clientPhone: normalized, serviceLabel: s.customRequest,
      comment: problem.trim() || s.callback.commentDefault,
    });
    router.push(THANK_YOU_PATH);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#161b24] via-[#0e1117] to-bm-black pb-24 pt-24 sm:pt-28" data-testid="service-catalogue">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-bm-accent">{copy.eyebrow}</p>
              <h1 className="mt-4 font-display text-[2.45rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-white sm:text-5xl">{copy.title}</h1>
              <p className="mt-4 text-base leading-relaxed text-bm-copy sm:text-lg">{copy.intro}</p>
            </div>
            <BookingLink trackSource="services_page_top" className="bm-btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-bold">
              <CalendarDays size={18} aria-hidden />{copy.cta}<ArrowRight size={17} aria-hidden />
            </BookingLink>
          </div>

          <section className="mt-9 rounded-[25px] border border-white/10 bg-[#191d25] p-4 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-6" aria-label={copy.search}>
            <label htmlFor="service-catalogue-query" className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-bm-red" size={22} aria-hidden />
              <span className="sr-only">{copy.search}</span>
              <input
                id="service-catalogue-query" type="search" value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search} autoComplete="off"
                className="h-14 w-full rounded-xl border border-white/20 bg-[#0e1117] pl-12 pr-4 text-base text-white outline-none placeholder:text-bm-muted focus:border-bm-red"
                data-testid="catalogue-search"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2" aria-label={copy.all}>
              {([
                ["all", copy.all], ["popular", copy.popular], ["repairs", copy.repairs], ["diagnostics", copy.diagnostics],
              ] as const).map(([id, label]) => (
                <button type="button" key={id} aria-pressed={category === id} onClick={() => setCategory(id)} className={category === id
                  ? "min-h-10 rounded-full border border-bm-red bg-bm-red/15 px-4 text-sm font-semibold text-white"
                  : "min-h-10 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-bm-copy hover:border-white/30 hover:text-white"}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {matched.map((item) => {
              const label = t.serviceItems[item.titleKey as keyof typeof t.serviceItems];
              return (
                <article key={item.href} className="flex min-h-[168px] flex-col justify-between rounded-2xl border border-white/[0.12] bg-[#1a1e26] p-5 transition-colors hover:border-bm-red/50" data-testid="service-result">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-bm-red/20 bg-bm-red/10 text-bm-accent"><ServiceIcon name={item.icon} size={25} /></div>
                    <ArrowRight size={17} className="text-bm-muted" aria-hidden/>
                  </div>
                  <h2 className="mt-4 text-lg font-bold leading-snug text-white">{label}</h2>
                  <div className="mt-4 flex gap-2">
                    <Link href={item.href} className="bm-btn-secondary inline-flex min-h-10 flex-1 items-center justify-center px-3 text-xs font-semibold">{copy.details}</Link>
                    <button type="button" onClick={() => {trackBookingOpen("services_grid_" + item.serviceId);setBookingService(item.serviceId);}} className="bm-btn-primary inline-flex min-h-10 flex-1 items-center justify-center px-3 text-xs font-bold">{copy.booking}</button>
                  </div>
                </article>
              );
            })}
          </div>
          {matched.length === 0 && additional.length === 0 ? (
            <p className="mt-8 rounded-xl border border-white/15 bg-white/5 p-5 text-sm text-bm-copy">{copy.noMatch}</p>
          ) : null}

          {additional.length > 0 ? (
            <details key={query} className="group mt-9 rounded-2xl border border-white/10 bg-white/[0.035] p-5" open={Boolean(needle)}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
                <span>{copy.more} <span className="ml-2 text-xs font-normal text-bm-label">({additional.length})</span></span>
                <ChevronDown size={20} className="text-bm-red transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <ul className="mt-5 grid gap-2 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                {additional.map((page) => (
                  <li key={page.slug}>
                    <Link href={"/" + page.slug} className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-sm text-bm-copy transition-colors hover:text-white hover:border-bm-red/40">
                      <span>{page.title.replace(" – BESS MOTORS", "")}</span><ArrowRight size={15} className="shrink-0 text-bm-red" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <section className="mt-12 grid gap-7 overflow-hidden rounded-[28px] border border-white/10 bg-[#161b23] p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12" aria-labelledby="services-help">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bm-red/10 text-bm-red"><CircleHelp size={25} aria-hidden /></div>
              <h2 id="services-help" className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{copy.help}</h2>
              <p className="mt-3 text-sm leading-relaxed text-bm-label">{s.subtitle}</p>
              <Link href="/cennik" className="bm-btn-secondary mt-6 inline-flex min-h-11 items-center gap-2 px-4 text-sm font-bold"><FileText size={17} aria-hidden />{s.viewPriceList}</Link>
              <p className="mt-5 flex items-center gap-2 text-xs text-bm-label"><MapPin size={15} className="text-bm-red" aria-hidden />{businessConfig.addressLine}</p>
            </div>
            <form onSubmit={submitCustomRequest} className="space-y-3">
              <label htmlFor="services-problem" className="block text-sm font-bold text-white">{copy.other}</label>
              <textarea id="services-problem" value={problem} onChange={(event) => setProblem(event.target.value)} required placeholder={s.describeProblem} className="min-h-[125px] w-full resize-y rounded-xl border border-white/20 bg-[#0d1016] p-4 text-sm text-white outline-none placeholder:text-bm-muted focus:border-bm-red" />
              <label htmlFor="services-phone" className="block text-sm font-bold text-white">{s.phonePlaceholder}</label>
              <input id="services-phone" value={phone} onChange={(event) => setPhone(event.target.value)} required type="tel" autoComplete="tel" placeholder={s.phonePlaceholder} className="h-12 w-full rounded-xl border border-white/20 bg-[#0d1016] px-4 text-sm text-white outline-none placeholder:text-bm-muted focus:border-bm-red" />
              <button type="submit" disabled={sending} className="bm-btn-primary flex min-h-12 w-full items-center justify-center gap-2 px-5 text-sm font-bold disabled:opacity-60">{sending ? "…" : s.submit}<ArrowRight size={17} aria-hidden /></button>
              {submitError ? <p role="alert" className="text-sm text-red-300">{submitError}</p> : null}
            </form>
          </section>
        </div>
      </div>
      {bookingService && <LazySmartBookingModal serviceId={bookingService} onClose={() => setBookingService(null)} />}
    </>
  );
}
