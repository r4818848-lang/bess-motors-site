import Link from "next/link";
import Image from "next/image";
import { EnhancementPhotoGallery } from "./EnhancementPhotoGallery";
import {
  ArrowRight, BadgeCheck, CarFront, Check, ChevronRight, ClipboardList, FileCheck2,
  MessageCircle, Phone, Sparkles, Wrench,
} from "lucide-react";
import { businessConfig } from "@/lib/businessConfig";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { ENHANCEMENT_HUB_SLUG, enhancementCategoryLabels, enhancementServices, type EnhancementCategory, type EnhancementService } from "@/lib/enhancement-services";

const categoryIcons: Record<EnhancementCategory, typeof Sparkles> = {
  lighting: Sparkles,
  upholstery: FileCheck2,
  exterior: CarFront,
  comfort: BadgeCheck,
  multimedia: Wrench,
  detailing: Sparkles,
};

function contactWhatsApp(service: string) {
  const message = "Dzień dobry, proszę o indywidualną wycenę usługi: " + service +
    ". Marka, model i rok auta: ... . Opis zakresu: ... . Mogę przesłać zdjęcia.";
  return businessConfig.whatsappUrl + "?text=" + encodeURIComponent(message);
}

export function EnhancementServicesGrid({ exclude }: { exclude?: string }) {
  const services = enhancementServices.filter((s) => s.slug !== exclude);
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="enhancement-service-grid">
      {services.map((service) => {
        const Icon = categoryIcons[service.category];
        return (
          <Link
            key={service.slug}
            href={"/" + service.slug}
            className="bm-premium-card group flex min-h-[175px] flex-col rounded-[22px] border border-white/15 bg-[#171b24] p-5 transition-colors hover:border-bm-accent/65"
            data-testid="enhancement-service-link"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-bm-accent/20 bg-bm-accent/10 text-bm-accent"><Icon size={22} aria-hidden /></span>
              <ArrowRight size={17} className="text-bm-label transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
            </div>
            {service.photos?.[0] ? <div className="relative mt-4 h-36 overflow-hidden rounded-xl border border-white/10"><Image src={service.photos[0].src} alt={service.photos[0].alt} fill loading="lazy" sizes="(max-width:640px) 92vw, (max-width:1279px) 45vw, 30vw" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.035]" /></div> : null}
            <h3 className="mt-5 font-display text-xl font-bold leading-tight text-white">{service.title}</h3>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-bm-label">{enhancementCategoryLabels[service.category]}</p>
          </Link>
        );
      })}
    </div>
  );
}

function Breadcrumbs({ current }: { current?: string }) {
  return (
    <nav aria-label="Ścieżka nawigacji" className="text-xs text-bm-label sm:text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/" className="hover:text-white">Strona główna</Link></li>
        <li><ChevronRight size={14} aria-hidden /></li>
        <li><Link href="/services" className="hover:text-white">Usługi</Link></li>
        <li><ChevronRight size={14} aria-hidden /></li>
        <li>
          {current ? (
            <Link href={"/" + ENHANCEMENT_HUB_SLUG} className="hover:text-white">Personalizacja auta</Link>
          ) : (
            <span aria-current="page" className="text-white">Personalizacja auta</span>
          )}
        </li>
        {current && <><li><ChevronRight size={14} aria-hidden /></li><li aria-current="page" className="font-medium text-white">{current}</li></>}
      </ol>
    </nav>
  );
}

export function EnhancementHubPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#151a23] via-[#0c1017] to-[#090c10] pb-24 pt-24 sm:pt-28" data-testid="enhancement-hub">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <Breadcrumbs />
        <div className="mt-9 grid items-center gap-7 lg:grid-cols-[1.2fr_.8fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-bm-accent"><Sparkles size={17} aria-hidden /> BESS MOTORS / STYLIZACJA I DOPOSAŻENIE</p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">Personalizacja samochodu Warszawa</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-bm-copy sm:text-lg">
              Chcesz zmienić wygląd auta, odświeżyć jego wnętrze lub dodać nowe wyposażenie?
              W BESS MOTORS możesz zapytać o oświetlenie ambientowe, obszywanie elementów tapicerki,
              montaż dodatków nadwozia, Apple CarPlay, wygłuszenie kabiny, folie samochodowe i czyszczenie wnętrza.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bm-label">
              Każdy projekt omawiamy indywidualnie. Dopasowanie części, materiał i zakres prac zależą od konkretnego samochodu.
              Na tym etapie nie publikujemy stałego cennika — wycenę przygotowujemy po ustaleniu szczegółów.
            </p>
          </div>
          <div className="rounded-[26px] border border-white/15 bg-[#181d26] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-bm-accent">Jak zacząć?</p>
            <ol className="mt-5 space-y-5">
              {[
                ["Opisz swój pomysł", "Wybierz usługę lub napisz, jak chcesz zmienić auto."],
                ["Prześlij zdjęcia i dane auta", "Podaj markę, model, rok i zakres planowanych zmian."],
                ["Uzgodnij zakres", "Najpierw oceniamy zgodność i przygotowujemy indywidualną wycenę."],
              ].map(([title, description], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bm-accent/35 text-xs font-bold text-bm-accent">0{i + 1}</span>
                  <span><strong className="block text-sm text-white">{title}</strong><span className="mt-1 block text-xs leading-relaxed text-bm-label">{description}</span></span>
                </li>
              ))}
            </ol>
            <SocialContactLink kind="whatsapp" href={contactWhatsApp("Personalizacja samochodu")} trackSource="customization_hub_quote" className="bm-btn-primary mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 px-4 text-sm font-bold">
              <MessageCircle size={19} aria-hidden /> Zapytaj o projekt <ArrowRight size={17} aria-hidden />
            </SocialContactLink>
          </div>
        </div>
        <section className="mt-14" aria-labelledby="customization-services-heading">
          <h2 id="customization-services-heading" className="mb-6 font-display text-3xl font-bold text-white">Wybierz rodzaj personalizacji</h2>
          <EnhancementServicesGrid />
        </section>
        <section className="mt-14 rounded-2xl border border-white/15 bg-white/[0.03] p-6" aria-labelledby="customization-location">
          <h2 id="customization-location" className="font-display text-2xl font-bold text-white">Personalizacja auta — Warszawa Włochy</h2>
          <p className="mt-3 text-sm leading-relaxed text-bm-copy">BESS MOTORS znajduje się przy {businessConfig.addressLine}. Możesz skonsultować plan zmian w samochodzie i uzgodnić indywidualny termin. Pokaż zdjęcia inspiracji oraz wybranego zestawu, jeśli już go posiadasz.</p>
          <Link href="/contacts" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-bm-accent hover:text-white">Kontakt i dojazd <ArrowRight size={17} aria-hidden /></Link>
        </section>
      </div>
    </main>
  );
}

export function EnhancementServicePage({ service }: { service: EnhancementService }) {
  const related = enhancementServices.filter((s) => s.slug !== service.slug && s.category === service.category).slice(0, 3);
  const alternatives = related.length ? related : enhancementServices.filter((s) => s.slug !== service.slug).slice(0, 3);
  const Icon = categoryIcons[service.category];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#151922] via-[#0e1118] to-[#090c10] pb-24 pt-24 sm:pt-28" data-testid="enhancement-service-page">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <Breadcrumbs current={service.title} />
        <div className="mt-8 grid items-center gap-9 lg:grid-cols-[1.25fr_.75fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-bm-accent"><Icon size={19} aria-hidden />{enhancementCategoryLabels[service.category]} / BESS MOTORS</p>
            <h1 className="mt-5 font-display text-[clamp(2.2rem,4vw,3.6rem)] font-bold leading-[1.06] tracking-tight text-white">{service.title} — Warszawa</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-bm-copy sm:text-lg">{service.intro}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bm-label sm:text-base">{service.explanation}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <SocialContactLink kind="whatsapp" href={contactWhatsApp(service.title)} trackSource="customization_service_hero" className="bm-btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-bold" data-testid="enhancement-quote">
                <MessageCircle size={19} aria-hidden /> Zapytaj o wycenę <ArrowRight size={17} aria-hidden />
              </SocialContactLink>
              <PhoneLink href={businessConfig.phoneHref} trackSource="customization_service_call" className="bm-btn-secondary inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-bold"><Phone size={18} aria-hidden /> Zadzwoń</PhoneLink>
            </div>
          </div>
          <aside className="rounded-[25px] border border-white/15 bg-[#191e28] p-6" aria-labelledby="enhancement-before-quote">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bm-accent/10 text-bm-accent"><ClipboardList size={23} aria-hidden /></div>
            <h2 id="enhancement-before-quote" className="mt-5 font-display text-2xl font-bold text-white">Co wysłać do wyceny?</h2>
            <ul className="mt-5 space-y-4">
              {service.preparation.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-bm-copy"><Check size={18} className="mt-0.5 shrink-0 text-bm-accent" aria-hidden />{item}</li>
              ))}
            </ul>
            <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-relaxed text-bm-label">
              Cena zależy od samochodu, materiałów i zakresu. Nie pokazujemy orientacyjnej kwoty bez ustalenia szczegółów.
            </p>
          </aside>
        </div>

        <section className="mt-16 scroll-mt-24" aria-labelledby="enhancement-scope-heading">
          <div className="mb-6 flex items-center gap-3"><span className="h-0.5 w-8 bg-bm-red" aria-hidden /><h2 id="enhancement-scope-heading" className="font-display text-3xl font-bold text-white">Co obejmuje usługa?</h2></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {service.scope.map((item, i) => (
              <div key={item} className="flex min-h-[92px] items-start gap-4 rounded-2xl border border-white/10 bg-[#171b23] p-5">
                <span className="text-xs font-bold tracking-widest text-bm-accent">0{i + 1}</span>
                <p className="text-sm leading-relaxed text-bm-copy">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-bm-label">Rzeczywisty zakres ustalamy po weryfikacji auta i wybranego rozwiązania.</p>
        </section>

        {service.photos?.length ? <EnhancementPhotoGallery photos={service.photos} /> : null}

        <section className="mt-14 scroll-mt-24" aria-labelledby="enhancement-faq-heading">
          <h2 id="enhancement-faq-heading" className="mb-6 font-display text-3xl font-bold text-white">Pytania i odpowiedzi</h2>
          <div className="space-y-3">
            {service.faq.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-white/15 bg-[#171b23] p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span><ChevronRight size={18} className="shrink-0 text-bm-accent transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-4 max-w-3xl border-t border-white/10 pt-4 text-sm leading-relaxed text-bm-copy">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[24px] border border-bm-red/35 bg-gradient-to-r from-[#241820] to-[#151923] p-6 sm:p-8" aria-labelledby="enhancement-contact-heading">
          <h2 id="enhancement-contact-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">Masz zdjęcia pomysłu lub zestawu?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bm-copy">Wyślij nam markę i model auta, kilka zdjęć oraz opis oczekiwanego efektu. Ustalimy, czy wybrany wariant można dopasować i jak przygotować wycenę.</p>
          <SocialContactLink kind="whatsapp" href={contactWhatsApp(service.title)} trackSource="customization_service_footer" className="bm-btn-primary mt-5 inline-flex min-h-12 items-center gap-2 px-5 text-sm font-bold"><MessageCircle size={18} aria-hidden /> Wyślij zapytanie <ArrowRight size={17} aria-hidden /></SocialContactLink>
        </section>

        <section className="mt-14" aria-labelledby="enhancement-related">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 id="enhancement-related" className="font-display text-2xl font-bold text-white">Powiązane usługi</h2>
            <Link href={"/" + ENHANCEMENT_HUB_SLUG} className="inline-flex items-center gap-2 text-sm font-bold text-bm-accent hover:text-white">Wszystkie usługi personalizacji <ArrowRight size={17} aria-hidden /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {alternatives.map((item) => (
              <Link href={"/" + item.slug} key={item.slug} className="flex min-h-24 items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#171b23] p-4 text-sm font-semibold text-white hover:border-bm-accent/60">{item.title}<ArrowRight size={17} className="shrink-0 text-bm-accent" aria-hidden /></Link>
            ))}
          </div>
        </section>
        <p className="mt-12 text-xs text-bm-label">BESS MOTORS • {businessConfig.addressLine} • Warszawa Włochy</p>
      </div>
    </main>
  );
}
