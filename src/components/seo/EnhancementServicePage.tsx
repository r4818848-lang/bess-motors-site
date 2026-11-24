"use client";

import Link from "next/link";
import Image from "next/image";
import { EnhancementPhotoGallery } from "./EnhancementPhotoGallery";
import {
  ArrowRight, BadgeCheck, CarFront, Check, ChevronRight, ClipboardList, FileCheck2,
  MessageCircle, Phone, Sparkles, Wrench,
} from "lucide-react";
import { businessConfig } from "@/lib/businessConfig";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import { enhancementUi, localizedEnhancementService } from "@/lib/enhancement-localization";
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

function contactWhatsApp(service: string, locale: Locale) {
  const copy = enhancementUi(locale).service;
  const message = copy.waGreeting + " " + service + ". " + copy.waDetails;
  return businessConfig.whatsappUrl + "?text=" + encodeURIComponent(message);
}

export function EnhancementServicesGrid({ exclude }: { exclude?: string }) {
  const { locale } = useI18n();
  const ui = enhancementUi(locale);
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
            {!exclude && service.photos?.[0] ? <div className="relative mt-4 h-36 overflow-hidden rounded-xl border border-white/10"><Image src={service.photos[0].src} alt={service.photos[0].alt} fill loading="lazy" sizes="(max-width:640px) 92vw, (max-width:1279px) 45vw, 30vw" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.035]" /></div> : null}
            <h3 className="mt-5 font-display text-xl font-bold leading-tight text-white">{locale === "ru" ? service.titleRu : service.title}</h3>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-bm-label">{ui.categories[service.category]}</p>
          </Link>
        );
      })}
    </div>
  );
}

function Breadcrumbs({ current }: { current?: string }) {
  const { locale } = useI18n();
  const ui = enhancementUi(locale);
  return (
    <nav aria-label={ui.nav.breadcrumbs} className="text-xs text-bm-label sm:text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/" className="hover:text-white">{ui.nav.home}</Link></li>
        <li><ChevronRight size={14} aria-hidden /></li>
        <li><Link href="/services" className="hover:text-white">{ui.nav.services}</Link></li>
        <li><ChevronRight size={14} aria-hidden /></li>
        <li>
          {current ? (
            <Link href={"/" + ENHANCEMENT_HUB_SLUG} className="hover:text-white">{ui.nav.hub}</Link>
          ) : (
            <span aria-current="page" className="text-white">{ui.nav.hub}</span>
          )}
        </li>
        {current && <><li><ChevronRight size={14} aria-hidden /></li><li aria-current="page" className="font-medium text-white">{current}</li></>}
      </ol>
    </nav>
  );
}

export function EnhancementHubPage() {
  const { locale } = useI18n();
  const ui = enhancementUi(locale);
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#151a23] via-[#0c1017] to-[#090c10] pb-24 pt-24 sm:pt-28" data-testid="enhancement-hub">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <Breadcrumbs />
        <div className="mt-9 grid items-center gap-7 lg:grid-cols-[1.2fr_.8fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-bm-accent"><Sparkles size={17} aria-hidden /> BESS MOTORS / {ui.hub.tagline}</p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">{ui.hub.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-bm-copy sm:text-lg">{ui.hub.intro}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bm-label">{ui.hub.note}</p>
          </div>
          <div className="rounded-[26px] border border-white/15 bg-[#181d26] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-bm-accent">{ui.hub.how}</p>
            <ol className="mt-5 space-y-5">
              {ui.hub.steps.map(([title, description], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bm-accent/35 text-xs font-bold text-bm-accent">0{i + 1}</span>
                  <span><strong className="block text-sm text-white">{title}</strong><span className="mt-1 block text-xs leading-relaxed text-bm-label">{description}</span></span>
                </li>
              ))}
            </ol>
            <SocialContactLink kind="whatsapp" href={contactWhatsApp(ui.nav.hub, locale)} trackSource="customization_hub_quote" className="bm-btn-primary mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 px-4 text-sm font-bold">
              <MessageCircle size={19} aria-hidden /> {ui.hub.ask} <ArrowRight size={17} aria-hidden />
            </SocialContactLink>
          </div>
        </div>
        <section className="mt-14" aria-labelledby="customization-services-heading">
          <h2 id="customization-services-heading" className="mb-6 font-display text-3xl font-bold text-white">{ui.hub.choose}</h2>
          <EnhancementServicesGrid />
        </section>
        <section className="mt-14" aria-labelledby="customization-compare">
          <div className="max-w-3xl">
            <h2 id="customization-compare" className="font-display text-2xl font-bold text-white sm:text-3xl">{ui.hub.compareTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-bm-copy sm:text-base">{ui.hub.compareIntro}</p>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-white/15 bg-[#171b23] p-5">
              <h3 className="font-display text-lg font-bold text-white">{ui.hub.cards[0].title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-bm-copy">{ui.hub.cards[0].intro}</p>
              <Link href="/oswietlenie-ambientowe-samochodu-warszawa" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bm-accent hover:text-white">
                {ui.hub.cards[0].link} <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
            <article className="rounded-2xl border border-white/15 bg-[#171b23] p-5">
              <div className="relative mb-4 h-40 overflow-hidden rounded-xl border border-white/10">
                <Image src="/images/enhancements/star-headliner/gwiezdne-niebo-gotowy-efekt.jpg" alt="Gotowy efekt gwiezdnego nieba w samochodowej podsufitce" fill quality={75} loading="lazy" sizes="(max-width:1024px) 90vw, 22vw" className="object-cover object-center" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">{ui.hub.cards[1].title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-bm-copy">{ui.hub.cards[1].intro}</p>
              <Link href="/gwiezdne-niebo-w-samochodzie-warszawa" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bm-accent hover:text-white">
                {ui.hub.cards[1].link} <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
            <article className="rounded-2xl border border-white/15 bg-[#171b23] p-5">
              <h3 className="font-display text-lg font-bold text-white">{ui.hub.cards[2].title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-bm-copy">{ui.hub.cards[2].intro}</p>
              <Link href="/wygluszenie-samochodu-warszawa" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bm-accent hover:text-white">
                {ui.hub.cards[2].link} <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
            <article className="rounded-2xl border border-white/15 bg-[#171b23] p-5">
              <h3 className="font-display text-lg font-bold text-white">{ui.hub.cards[3].title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-bm-copy">{ui.hub.cards[3].intro}</p>
              <Link href="/montaz-apple-carplay-warszawa" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bm-accent hover:text-white">
                {ui.hub.cards[3].link} <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-bm-label">{ui.hub.compareNote}</p>
        </section>
        <section className="mt-14 rounded-2xl border border-white/15 bg-white/[0.03] p-6" aria-labelledby="customization-location">
          <h2 id="customization-location" className="font-display text-2xl font-bold text-white">{ui.hub.locationTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-bm-copy">{ui.hub.locationIntro}</p>
          <Link href="/contacts" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-bm-accent hover:text-white">{ui.hub.directions} <ArrowRight size={17} aria-hidden /></Link>
        </section>
      </div>
    </main>
  );
}

export function EnhancementServicePage({ service }: { service: EnhancementService }) {
  const { locale } = useI18n();
  const ui = enhancementUi(locale);
  const view = localizedEnhancementService(service, locale);
  const related = enhancementServices.filter((s) => s.slug !== service.slug && s.category === service.category).slice(0, 3);
  const alternatives = related.length ? related : enhancementServices.filter((s) => s.slug !== service.slug).slice(0, 3);
  const Icon = categoryIcons[service.category];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#151922] via-[#0e1118] to-[#090c10] pb-24 pt-24 sm:pt-28" data-testid="enhancement-service-page">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <Breadcrumbs current={view.title} />
        <div className="mt-8 grid items-center gap-9 lg:grid-cols-[1.25fr_.75fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-bm-accent"><Icon size={19} aria-hidden />{ui.categories[service.category]} / BESS MOTORS</p>
            <h1 className="mt-5 font-display text-[clamp(2.2rem,4vw,3.6rem)] font-bold leading-[1.06] tracking-tight text-white">{view.title} — {locale === "ru" ? "Варшава" : "Warszawa"}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-bm-copy sm:text-lg">{view.intro}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bm-label sm:text-base">{view.explanation}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <SocialContactLink kind="whatsapp" href={contactWhatsApp(view.title, locale)} trackSource={"customization_" + service.slug + "_whatsapp"} className="bm-btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-bold" data-testid="enhancement-quote">
                <MessageCircle size={19} aria-hidden /> {ui.service.quote} <ArrowRight size={17} aria-hidden />
              </SocialContactLink>
              <PhoneLink href={businessConfig.phoneHref} trackSource={"customization_" + service.slug + "_call"} className="bm-btn-secondary inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-bold"><Phone size={18} aria-hidden /> {ui.service.phone}</PhoneLink>
            </div>
          </div>
          <aside className="rounded-[25px] border border-white/15 bg-[#191e28] p-6" aria-labelledby="enhancement-before-quote">
            {service.slug === "gwiezdne-niebo-w-samochodzie-warszawa" && service.photos?.[0] ? (
              <figure className="mb-6">
                <div className="relative mx-auto aspect-[3/4] max-h-[390px] overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <Image src={service.photos[0].src} alt={service.photos[0].alt} fill quality={75} priority sizes="(max-width:1024px) 90vw, 27vw" className="object-cover object-center" />
                </div>
                <figcaption className="mt-2 text-xs text-bm-label">{ui.service.starExample}</figcaption>
              </figure>
            ) : null}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bm-accent/10 text-bm-accent"><ClipboardList size={23} aria-hidden /></div>
            <h2 id="enhancement-before-quote" className="mt-5 font-display text-2xl font-bold text-white">{ui.service.quoteTitle}</h2>
            <ul className="mt-5 space-y-4">
              {view.preparation.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-bm-copy"><Check size={18} className="mt-0.5 shrink-0 text-bm-accent" aria-hidden />{item}</li>
              ))}
            </ul>
            <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-relaxed text-bm-label">{ui.service.quoteNote}</p>
          </aside>
        </div>

        <section className="mt-16 scroll-mt-24" aria-labelledby="enhancement-scope-heading">
          <div className="mb-6 flex items-center gap-3"><span className="h-0.5 w-8 bg-bm-red" aria-hidden /><h2 id="enhancement-scope-heading" className="font-display text-3xl font-bold text-white">{ui.service.scope}</h2></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {view.scope.map((item, i) => (
              <div key={item} className="flex min-h-[92px] items-start gap-4 rounded-2xl border border-white/10 bg-[#171b23] p-5">
                <span className="text-xs font-bold tracking-widest text-bm-accent">0{i + 1}</span>
                <p className="text-sm leading-relaxed text-bm-copy">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-bm-label">{ui.service.scopeNote}</p>
        </section>

        {service.photos?.length ? <EnhancementPhotoGallery photos={service.photos} /> : null}

        <section className="mt-14 scroll-mt-24" aria-labelledby="enhancement-faq-heading">
          <h2 id="enhancement-faq-heading" className="mb-6 font-display text-3xl font-bold text-white">{ui.service.faq}</h2>
          <div className="space-y-3">
            {view.faq.map((faq) => (
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
          <h2 id="enhancement-contact-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">{ui.service.contactTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bm-copy">{ui.service.contactIntro}</p>
          <SocialContactLink kind="whatsapp" href={contactWhatsApp(view.title, locale)} trackSource={"customization_" + service.slug + "_footer_whatsapp"} className="bm-btn-primary mt-5 inline-flex min-h-12 items-center gap-2 px-5 text-sm font-bold"><MessageCircle size={18} aria-hidden /> {ui.service.contactSend} <ArrowRight size={17} aria-hidden /></SocialContactLink>
        </section>

        <section className="mt-14" aria-labelledby="enhancement-related">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 id="enhancement-related" className="font-display text-2xl font-bold text-white">{ui.service.related}</h2>
            <Link href={"/" + ENHANCEMENT_HUB_SLUG} className="inline-flex items-center gap-2 text-sm font-bold text-bm-accent hover:text-white">{ui.service.all} <ArrowRight size={17} aria-hidden /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {alternatives.map((item) => (
              <Link href={"/" + item.slug} key={item.slug} className="flex min-h-24 items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#171b23] p-4 text-sm font-semibold text-white hover:border-bm-accent/60">{locale === "ru" ? item.titleRu : item.title}<ArrowRight size={17} className="shrink-0 text-bm-accent" aria-hidden /></Link>
            ))}
          </div>
        </section>
        <p className="mt-12 text-xs text-bm-label">BESS MOTORS • {businessConfig.addressLine} • Warszawa Włochy</p>
      </div>
    </main>
  );
}
