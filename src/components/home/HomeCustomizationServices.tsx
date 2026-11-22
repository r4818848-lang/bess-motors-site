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

export function HomeCustomizationServices() {
  const featured = featuredSlugs.flatMap((slug) => {
    const service = enhancementServices.find((item) => item.slug === slug);
    return service ? [service] : [];
  });
  return (
    <section aria-labelledby="home-customization-heading" className="bg-[#10151e] py-12 sm:py-16" data-testid="home-customization-services">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-bm-accent"><Sparkles size={16} aria-hidden /> BESS MOTORS / STYLIZACJA AUTA</p>
            <h2 id="home-customization-heading" className="mt-3 font-display text-2xl font-bold text-white sm:text-4xl">Detailing i personalizacja samochodu w Warszawie</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bm-copy sm:text-base">Przyciemnianie szyb, czyszczenie wnętrza, folie, body kity, spoilery i oświetlenie LED. Wybierz usługę, sprawdź zakres i poproś o indywidualną wycenę.</p>
          </div>
          <Link href={"/" + ENHANCEMENT_HUB_SLUG} className="inline-flex min-h-11 items-center gap-2 font-semibold text-bm-accent hover:text-white">Wszystkie usługi <ArrowRight size={17} aria-hidden /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {featured.map((service) => (
            <Link key={service.slug} href={"/" + service.slug} className="group flex min-h-32 flex-col justify-between rounded-2xl border border-white/15 bg-[#191f2a] p-4 transition-colors hover:border-bm-accent/70" data-testid="home-customization-link">
              <CarFront className="text-bm-accent" size={23} aria-hidden />
              <span className="mt-5 flex items-end justify-between gap-2 text-sm font-semibold leading-snug text-white sm:text-base">{service.title}<ArrowRight size={16} className="shrink-0 text-bm-accent transition-transform group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
