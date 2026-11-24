"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type ServiceLink = { href: string; pl: string; ru: string; uk: string; en: string };

/** Mechanical work remains the primary commercial cluster on the homepage. */
const mechanical: ServiceLink[] = [
  { href: "/wymiana-oleju", pl: "Wymiana oleju i filtrów", ru: "Замена масла и фильтров", uk: "Заміна оливи та фільтрів", en: "Oil and filter change" },
  { href: "/wymiana-opon-warszawa", pl: "Wymiana i wyważanie opon", ru: "Шиномонтаж и балансировка", uk: "Шиномонтаж та балансування", en: "Tyres and wheel balancing" },
  { href: "/hamulce", pl: "Serwis hamulców", ru: "Ремонт тормозов", uk: "Ремонт гальм", en: "Brake service" },
  { href: "/naprawa-zawieszenia-warszawa", pl: "Naprawa zawieszenia", ru: "Ремонт подвески", uk: "Ремонт підвіски", en: "Suspension repair" },
  { href: "/diagnostyka-komputerowa-warszawa", pl: "Diagnostyka komputerowa", ru: "Компьютерная диагностика", uk: "Комп’ютерна діагностика", en: "Computer diagnostics" },
  { href: "/wymiana-rozrzadu-warszawa", pl: "Wymiana rozrządu", ru: "Замена ГРМ", uk: "Заміна ГРМ", en: "Timing belt and chain" },
  { href: "/wymiana-sprzegla-warszawa", pl: "Wymiana sprzęgła", ru: "Замена сцепления", uk: "Заміна зчеплення", en: "Clutch replacement" },
  { href: "/serwis-klimatyzacji-warszawa", pl: "Serwis klimatyzacji", ru: "Обслуживание кондиционера", uk: "Сервіс кондиціонера", en: "Air conditioning service" },
  { href: "/wymiana-oleju-skrzynia-automatyczna-warszawa", pl: "Statyczna wymiana oleju ATF", ru: "Статическая замена ATF", uk: "Статична заміна ATF", en: "Static ATF oil change" },
  { href: "/czyszczenie-egr-warszawa", pl: "Czyszczenie EGR", ru: "Чистка EGR", uk: "Чищення EGR", en: "EGR cleaning" },
  { href: "/diagnostyka-dymem-warszawa", pl: "Diagnostyka dymem", ru: "Диагностика дымом", uk: "Діагностика димом", en: "Smoke leak diagnostics" },
  { href: "/serwis-haldex-warszawa", pl: "Serwis Haldex", ru: "Обслуживание Haldex", uk: "Обслуговування Haldex", en: "Haldex service" },
  { href: "/serwis-flot-warszawa", pl: "Serwis samochodów flotowych", ru: "Обслуживание автопарков", uk: "Сервіс автопарків", en: "Fleet vehicle maintenance" },
  { href: "/mechanik-warszawa-wlochy", pl: "Mechanik Warszawa Włochy", ru: "Автомеханик Варшава Włochy", uk: "Автомеханік Варшава Włochy", en: "Warsaw Włochy car mechanic" },
];

const enhancements: ServiceLink[] = [
  { href: "/pranie-tapicerki-samochodowej-warszawa", pl: "Detailing wnętrza i pranie tapicerki", ru: "Химчистка и детейлинг салона", uk: "Хімчистка та детейлінг салону", en: "Interior detailing and upholstery cleaning" },
  { href: "/oswietlenie-ambientowe-samochodu-warszawa", pl: "Montaż ambient light i LED", ru: "Установка Ambient LED", uk: "Встановлення Ambient LED", en: "Ambient LED lighting" },
  { href: "/gwiezdne-niebo-w-samochodzie-warszawa", pl: "Gwiezdne niebo w podsufitce", ru: "Звёздное небо в потолке", uk: "Зоряне небо в стелі", en: "Starlight headliner" },
  { href: "/wygluszenie-samochodu-warszawa", pl: "Wygłuszenie samochodu", ru: "Шумоизоляция автомобиля", uk: "Шумоізоляція автомобіля", en: "Car soundproofing" },
  { href: "/montaz-apple-carplay-warszawa", pl: "Montaż Apple CarPlay i Android Auto", ru: "Установка CarPlay и Android Auto", uk: "Встановлення CarPlay та Android Auto", en: "CarPlay and Android Auto retrofit" },
  { href: "/przyciemnianie-szyb-samochodowych-warszawa", pl: "Przyciemnianie szyb folią", ru: "Тонировка стёкол", uk: "Тонування скла", en: "Car window tinting" },
  { href: "/aromatyzacja-samochodu-warszawa", pl: "Aromatyzacja wnętrza samochodu", ru: "Ароматизация салона", uk: "Ароматизація салону", en: "Car fragrance systems" },
  { href: "/oklejanie-samochodu-folia-warszawa", pl: "Oklejanie auta folią", ru: "Оклейка автомобиля плёнкой", uk: "Обклеювання авто плівкою", en: "Car vinyl wrapping" },
  { href: "/personalizacja-samochodu-warszawa", pl: "Wszystkie usługi personalizacji", ru: "Все услуги персонализации", uk: "Усі послуги персоналізації", en: "All car customization services" },
];

const headings = {
  pl: { title: "Mechanik i serwis samochodowy — cała Warszawa", sub: "Główny zakres prac: diagnostyka, olej, hamulce, zawieszenie, opony, rozrząd i naprawy. Jeden warsztat: Aleja Krakowska 48/52, Warszawa Włochy.", secondary: "Dodatkowo: detailing i personalizacja", note: "Przyjmujemy kierowców z całej Warszawy. Wycena zależy od samochodu i zakresu; nie wykonujemy geometrii kół ani dynamicznej wymiany ATF.", all: "Katalog usług" },
  ru: { title: "Автомеханик и автосервис — вся Варшава", sub: "Наш приоритет: диагностика, масло, тормоза, подвеска, шины, ГРМ и ремонт. Одна мастерская: Aleja Krakowska 48/52, Warszawa Włochy.", secondary: "Дополнительно: детейлинг и персонализация", note: "Принимаем автомобили со всей Варшавы. Стоимость зависит от работ; развал-схождение и динамическую замену ATF не выполняем.", all: "Каталог услуг" },
  uk: { title: "Автомеханік та автосервіс — уся Варшава", sub: "Наш пріоритет: діагностика, олива, гальма, підвіска, шини, ГРМ і ремонт. Майстерня: Aleja Krakowska 48/52, Warszawa Włochy.", secondary: "Додатково: детейлінг і персоналізація", note: "Приймаємо авто з усієї Варшави. Не виконуємо розвал-сходження та динамічну заміну ATF.", all: "Каталог послуг" },
  en: { title: "Car mechanic and repair services — across Warsaw", sub: "Our priority: diagnostics, oil changes, brakes, suspension, tyres, timing and repairs. One workshop: Aleja Krakowska 48/52, Warsaw Włochy.", secondary: "Also available: detailing and customization", note: "We welcome drivers from across Warsaw. No wheel alignment or dynamic ATF exchange.", all: "Service catalog" },
} as const;

function ServicesList({ links, locale }: { links: ServiceLink[]; locale: keyof typeof headings }) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-bm-card px-4 py-3 text-sm text-bm-silver transition-colors hover:border-bm-red/40 hover:text-white">
            <span className="font-medium leading-snug">{link[locale]}</span>
            <ChevronRight size={16} className="shrink-0 text-bm-red" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HomeSeoServiceLinks() {
  const { locale } = useI18n();
  const c = headings[locale];
  return (
    <section className="border-t border-white/10 bg-bm-surface/40 py-10 sm:py-12" aria-labelledby="seo-services-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h2 id="seo-services-heading" className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">{c.title}</h2>
            <p className="mt-2 text-sm text-bm-muted">{c.sub}</p>
          </div>
          <Link href="/services" className="btn-outline inline-flex items-center gap-2 text-sm">{c.all}<ChevronRight size={16} aria-hidden /></Link>
        </div>
        <ServicesList links={mechanical} locale={locale} />
        <h3 className="mt-9 font-display text-lg font-bold text-white sm:text-xl">{c.secondary}</h3>
        <ServicesList links={enhancements} locale={locale} />
        <p className="mt-6 text-xs leading-relaxed text-bm-label">{c.note}</p>
      </div>
    </section>
  );
}
