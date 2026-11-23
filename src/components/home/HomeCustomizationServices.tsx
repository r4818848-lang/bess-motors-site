"use client";

import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";
import { ArrowRight, CarFront, Sparkles } from "lucide-react";
import { ENHANCEMENT_HUB_SLUG, enhancementServices } from "@/lib/enhancement-services";

const featuredSlugs = [
  "przyciemnianie-szyb-samochodowych-warszawa",
  "pranie-tapicerki-samochodowej-warszawa",
  "oklejanie-samochodu-folia-warszawa",
  "montaz-body-kitu-warszawa",
  "montaz-spoilera-samochodowego-warszawa",
  "montaz-ducktaila-warszawa",
  "podswietlenie-podwozia-samochodu-warszawa",
  "usuwanie-wgniecen-bez-lakierowania-warszawa",
  "aromatyzacja-samochodu-warszawa",
  "oswietlenie-ambientowe-samochodu-warszawa",
] as const;

// Temporary royalty-free Unsplash photography. Replace with verified BESS MOTORS work photos.
const temporaryPhotos = [
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=78",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=78",
  "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=700&q=78",
  "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=700&q=78",
  "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=700&q=78",
] as const;

const localizedCopy = {
  pl: { eyebrow: "BESS MOTORS / STYLIZACJA AUTA", heading: "Detailing i personalizacja samochodu w Warszawie", description: "Przyciemnianie szyb, czyszczenie wnętrza, folie, body kity, spoilery i oświetlenie LED. Wybierz usługę, sprawdź zakres i poproś o indywidualną wycenę.", all: "Wszystkie usługi", titles: ["Przyciemnianie szyb samochodowych folią", "Pranie tapicerki i czyszczenie wnętrza", "Oklejanie samochodu folią", "Montaż body kitu i owiewek stylistycznych", "Montaż spoilera samochodowego", "Montaż ducktaila na klapie bagażnika", "Montaż podświetlenia podwozia LED", "Usuwanie wgnieceń bez lakierowania (PDR)", "Aromatyzacja wnętrza samochodu", "Montaż uniwersalnego oświetlenia ambientowego LED"] },
  ru: { eyebrow: "BESS MOTORS / СТАЙЛИНГ АВТО", heading: "Детейлинг и персонализация автомобиля в Варшаве", description: "Тонировка стёкол, химчистка салона, оклейка плёнкой, обвесы, спойлеры и LED-подсветка. Выберите услугу и запросите индивидуальный расчёт стоимости.", all: "Все услуги", titles: ["Тонировка стёкол автомобиля", "Химчистка салона и сидений", "Оклейка автомобиля плёнкой", "Установка обвесов и аэродинамических элементов", "Установка спойлера", "Установка спойлера ducktail", "Установка подсветки днища LED", "Удаление вмятин без покраски (PDR)", "Ароматизация салона автомобиля", "Установка универсальной амбиентной LED-подсветки"] },
  en: { eyebrow: "BESS MOTORS / CAR CUSTOMIZATION", heading: "Car detailing and customization in Warsaw", description: "Window tinting, interior cleaning, wraps, body kits, spoilers and LED lighting. Choose a service and request a personalized quote.", all: "All services", titles: ["Car window tinting", "Upholstery and interior cleaning", "Car vinyl wrapping", "Body kit installation", "Car spoiler installation", "Ducktail spoiler installation", "LED underglow installation", "Paintless dent repair (PDR)", "Car interior fragrance", "Universal ambient LED lighting installation"] },
  uk: { eyebrow: "BESS MOTORS / СТАЙЛІНГ АВТО", heading: "Детейлінг і персоналізація автомобіля у Варшаві", description: "Тонування скла, хімчистка салону, обклеювання плівкою, обвіси, спойлери та LED-підсвічування. Оберіть послугу й отримайте індивідуальний розрахунок вартості.", all: "Усі послуги", titles: ["Тонування скла автомобіля", "Хімчистка салону та сидінь", "Обклеювання автомобіля плівкою", "Встановлення обвісів і аеродинамічних елементів", "Встановлення спойлера", "Встановлення спойлера ducktail", "Встановлення LED-підсвічування днища", "Видалення вм’ятин без фарбування (PDR)", "Ароматизація салону автомобіля", "Встановлення універсального амбієнтного LED-підсвічування"] },
} as const;

export function HomeCustomizationServices() {
  const { locale } = useI18n();
  const c = localizedCopy[locale];
  const featured = featuredSlugs.flatMap((slug) => {
    const service = enhancementServices.find((item) => item.slug === slug);
    return service ? [service] : [];
  });
  return (
    <section aria-labelledby="home-customization-heading" className="bg-[#10151e] py-12 sm:py-16" data-testid="home-customization-services">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-bm-accent"><Sparkles size={16} aria-hidden /> {c.eyebrow}</p>
            <h2 id="home-customization-heading" className="mt-3 font-display text-2xl font-bold text-white sm:text-4xl">{c.heading}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bm-copy sm:text-base">{c.description}</p>
          </div>
          <Link href={"/" + ENHANCEMENT_HUB_SLUG} className="inline-flex min-h-11 items-center gap-2 font-semibold text-bm-accent hover:text-white">{c.all} <ArrowRight size={17} aria-hidden /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {featured.map((service, index) => (
            <Link key={service.slug} href={"/" + service.slug} className="group relative isolate flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-[#191f2a] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-bm-accent/70 sm:min-h-44" data-testid="home-customization-link">
              <div aria-hidden className="absolute inset-0 -z-20 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url("${temporaryPhotos[index % temporaryPhotos.length]}")` }} />
              <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080c13]/95 via-[#080c13]/65 to-[#080c13]/35" />
              <CarFront className="text-bm-accent drop-shadow-md" size={23} aria-hidden />
              <span className="mt-5 flex items-end justify-between gap-2 text-sm font-semibold leading-snug text-white drop-shadow-md sm:text-base">{c.titles[index]}<ArrowRight size={16} className="shrink-0 text-bm-accent transition-transform group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
