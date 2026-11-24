"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CarFront, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { ENHANCEMENT_HUB_SLUG, enhancementServices } from "@/lib/enhancement-services";

/**
 * Supporting offer after the core mechanical work and verified repairs.
 * Show matching owner-supplied illustrative photos only. No stock photographs
 * presented as finished workshop jobs.
 */
const featuredSlugs = [
  "pranie-tapicerki-samochodowej-warszawa",
  "przyciemnianie-szyb-samochodowych-warszawa",
  "oswietlenie-ambientowe-samochodu-warszawa",
  "gwiezdne-niebo-w-samochodzie-warszawa",
  "wygluszenie-samochodu-warszawa",
  "montaz-apple-carplay-warszawa",
  "aromatyzacja-samochodu-warszawa",
  "oklejanie-samochodu-folia-warszawa",
  "montaz-body-kitu-warszawa",
  "usuwanie-wgniecen-bez-lakierowania-warszawa",
] as const;

const localizedCopy = {
  pl: {
    eyebrow: "DODATKOWE MOŻLIWOŚCI BESS MOTORS",
    heading: "Detailing, oświetlenie i personalizacja aut w Warszawie",
    description: "Pranie tapicerki, przyciemnianie szyb, ambient LED, gwiezdne niebo, wygłuszenie, CarPlay i indywidualne projekty. To dodatkowe usługi obok naszej głównej oferty mechaniki samochodowej.",
    area: "Jesteśmy przy Alei Krakowskiej 48/52, Warszawa Włochy. Zapraszamy kierowców z całej Warszawy — usługi wykonujemy w naszym warsztacie, a zakres i cenę ustalamy po sprawdzeniu auta.",
    all: "Zobacz wszystkie usługi personalizacji",
    preview: "Zdjęcie przykładowego efektu",
    quote: "Indywidualna wycena",
    titles: ["Pranie tapicerki i czyszczenie wnętrza", "Przyciemnianie szyb folią", "Ambient Light i uniwersalne LED", "Gwiezdne niebo w podsufitce", "Wygłuszenie samochodu", "Apple CarPlay / Android Auto", "Aromatyzacja wnętrza", "Oklejanie auta folią", "Montaż body kitu", "Usuwanie wgnieceń PDR"],
  },
  ru: {
    eyebrow: "ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ BESS MOTORS",
    heading: "Детейлинг, подсветка и персонализация авто в Варшаве",
    description: "Химчистка, тонировка, Ambient LED, звёздное небо, шумоизоляция, CarPlay и индивидуальные проекты — в дополнение к основной механической специализации автосервиса.",
    area: "Мы находимся на Aleja Krakowska 48/52 в районе Włochy. Принимаем клиентов со всей Варшавы в нашем автосервисе; стоимость согласуем после осмотра автомобиля.",
    all: "Все услуги персонализации",
    preview: "Фото примерного результата",
    quote: "Индивидуальная стоимость",
    titles: ["Химчистка салона", "Тонировка стёкол", "Амбиентная LED-подсветка", "Звёздное небо в потолке", "Шумоизоляция автомобиля", "Apple CarPlay / Android Auto", "Ароматизация салона", "Оклейка плёнкой", "Установка обвесов", "Удаление вмятин PDR"],
  },
  uk: {
    eyebrow: "ДОДАТКОВІ ПОСЛУГИ BESS MOTORS",
    heading: "Детейлінг, підсвічування та персоналізація авто у Варшаві",
    description: "Хімчистка, тонування, Ambient LED, зоряне небо, шумоізоляція, CarPlay та індивідуальні проєкти — додатково до основного механічного сервісу.",
    area: "Наш сервіс за адресою Aleja Krakowska 48/52, Warszawa Włochy. Приймаємо клієнтів з усієї Варшави у майстерні; вартість погоджуємо індивідуально.",
    all: "Усі послуги персоналізації",
    preview: "Фото прикладу ефекту",
    quote: "Індивідуальний кошторис",
    titles: ["Хімчистка салону", "Тонування скла", "Амбієнтне LED-підсвічування", "Зоряне небо в стелі", "Шумоізоляція автомобіля", "Apple CarPlay / Android Auto", "Ароматизація салону", "Обклеювання плівкою", "Монтаж обвісів", "Видалення вм'ятин PDR"],
  },
  en: {
    eyebrow: "ADDITIONAL BESS MOTORS SERVICES",
    heading: "Detailing, lighting and car customization in Warsaw",
    description: "Interior cleaning, window tinting, ambient LED lighting, starlight headliners, soundproofing, CarPlay and bespoke styling — alongside our primary mechanical services.",
    area: "Visit our workshop at Aleja Krakowska 48/52 in Warsaw Włochy. We welcome drivers from across Warsaw; quotes are prepared after reviewing your vehicle.",
    all: "All customization services",
    preview: "Illustrative effect photo",
    quote: "Individual quote",
    titles: ["Interior and upholstery cleaning", "Car window tinting", "Ambient LED lighting", "Starlight headliner", "Car soundproofing", "Apple CarPlay / Android Auto", "Interior fragrance systems", "Car wrapping", "Body kit installation", "Paintless dent repair"],
  },
} as const;

export function HomeCustomizationServices() {
  const { locale } = useI18n();
  const c = localizedCopy[locale];
  const featured = featuredSlugs.flatMap((slug, index) => {
    const service = enhancementServices.find((item) => item.slug === slug);
    return service ? [{ service, title: c.titles[index] }] : [];
  });

  return (
    <section aria-labelledby="home-customization-heading" className="bg-[#10151e] py-12 sm:py-16" data-testid="home-customization-services">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-4xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-bm-accent"><Sparkles size={16} aria-hidden /> {c.eyebrow}</p>
            <h2 id="home-customization-heading" className="mt-3 font-display text-2xl font-bold text-white sm:text-4xl">{c.heading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-bm-copy sm:text-base">{c.description}</p>
            <p className="mt-3 text-sm leading-relaxed text-bm-label">{c.area}</p>
          </div>
          <Link href={"/" + ENHANCEMENT_HUB_SLUG} className="inline-flex min-h-11 items-center gap-2 font-semibold text-bm-accent hover:text-white">{c.all} <ArrowRight size={17} aria-hidden /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {featured.map(({ service, title }) => {
            const photo = service.photos?.[0];
            return (
              <Link key={service.slug} href={"/" + service.slug} className="group relative isolate flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#263142] to-[#111620] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-bm-accent/70 sm:min-h-48" data-testid="home-customization-link">
                {photo ? (
                  <Image src={photo.src} alt={photo.alt} fill loading="lazy" sizes="(max-width:640px) 45vw, (max-width:1279px) 30vw, 18vw" className="-z-20 object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <CarFront size={74} aria-hidden className="absolute -z-20 right-2 top-1/3 text-white/[0.07]" />
                )}
                {photo ? <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080c13]/95 via-[#080c13]/65 to-[#080c13]/20" /> : null}
                <span className="text-[10px] font-bold uppercase tracking-wider text-bm-accent">{photo ? c.preview : c.quote}</span>
                <span className="mt-8 flex items-end justify-between gap-2 text-sm font-semibold leading-snug text-white sm:text-base">{title}<ArrowRight size={16} className="shrink-0 text-bm-accent transition-transform group-hover:translate-x-1" aria-hidden /></span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
