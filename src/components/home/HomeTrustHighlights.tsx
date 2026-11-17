"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardList, Languages, MessageSquareText, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { businessConfig } from "@/lib/businessConfig";
import { contentLocale } from "@/lib/i18n/locale-utils";

const copy = {
  pl: {
    eyebrow: "DLACZEGO MY",
    before: "Uzgodniona wycena",
    beforeDesc: "Zakres i cena przed naprawą",
    service: "Przejrzysty proces",
    serviceDesc: "Diagnoza i omówienie prac",
    languages: "4 języki obsługi",
    languagesDesc: "Polski, русский, українська, English",
    google: "Opinie klientów",
    view: "Zobacz opinie w Google",
    reviews: "opinii w Google",
  },
  ru: {
    eyebrow: "ПОЧЕМУ МЫ",
    before: "Согласование цены",
    beforeDesc: "Стоимость до ремонта",
    service: "Понятный процесс",
    serviceDesc: "Диагностика и план работ",
    languages: "Обслуживание на 4 языках",
    languagesDesc: "Polski, русский, українська, English",
    google: "Отзывы клиентов",
    view: "Отзывы в Google",
    reviews: "отзывов в Google",
  },
  uk: {
    eyebrow: "ЧОМУ МИ",
    before: "Узгодження вартості",
    beforeDesc: "Ціна до початку ремонту",
    service: "Зрозумілий процес",
    serviceDesc: "Діагностика та план робіт",
    languages: "Обслуговування 4 мовами",
    languagesDesc: "Polski, русский, українська, English",
    google: "Відгуки клієнтів",
    view: "Відгуки в Google",
    reviews: "відгуків у Google",
  },
  en: {
    eyebrow: "WHY CHOOSE US",
    before: "Agreed pricing",
    beforeDesc: "A quote before repairs",
    service: "Clear process",
    serviceDesc: "Diagnosis and work explained",
    languages: "Service in 4 languages",
    languagesDesc: "Polski, русский, українська, English",
    google: "Customer reviews",
    view: "Reviews on Google",
    reviews: "Google reviews",
  },
} as const;

type PublicRating = { source?: string; rating?: number; userRatingCount?: number };

export function HomeTrustHighlights() {
  const { locale } = useI18n();
  const ui = copy[locale];
  const [rating, setRating] = useState<PublicRating | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/google-reviews?lang=" + contentLocale(locale), { signal: controller.signal })
      .then((res) => res.ok ? res.json() as Promise<PublicRating> : null)
      .then((data) => {
        if (!controller.signal.aborted && data?.source === "google") setRating(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [locale]);

  const benefits = [
    { icon: ClipboardList, title: ui.before, description: ui.beforeDesc },
    { icon: MessageSquareText, title: ui.service, description: ui.serviceDesc },
    { icon: Languages, title: ui.languages, description: ui.languagesDesc },
  ] as const;
  const hasVerifiedRating = rating?.source === "google" && typeof rating.rating === "number" && Number.isFinite(rating.rating) &&
    (rating.userRatingCount ?? 0) > 0;

  return (
    <section className="border-t border-white/10 bg-[#090d13] py-10 sm:py-14" aria-labelledby="home-why-summary" data-testid="home-trust-summary">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-[2px] w-8 bg-bm-red" aria-hidden />
          <h2 id="home-why-summary" className="font-display text-xs font-bold uppercase tracking-[0.20em] text-bm-copy">{ui.eyebrow}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-5">
          {benefits.map((item) => (
            <div key={item.title} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:flex sm:items-start sm:gap-4 sm:p-5">
              <item.icon size={26} className="mb-3 shrink-0 text-bm-accent sm:mb-0" aria-hidden />
              <div>
                <h3 className="font-display text-[13px] font-bold leading-tight text-white sm:text-lg">{item.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-bm-label sm:text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href={businessConfig.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative mt-7 flex min-h-[76px] flex-wrap items-center gap-x-5 gap-y-2 overflow-hidden rounded-2xl border border-bm-red/45 bg-gradient-to-r from-[#19161b] via-[#24171d] to-[#14171c] px-5 py-4 text-white shadow-[0_8px_35px_rgba(225,6,0,.1)] sm:px-7"
          data-testid="home-google-ribbon"
        >
          <span className="flex items-center gap-3 font-display text-base font-bold sm:text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white text-lg font-extrabold text-[#4285F4]" aria-hidden>G</span>
            {ui.google}
          </span>
          {hasVerifiedRating ? (
            <span className="inline-flex items-center gap-2" data-testid="home-verified-google-rating">
              <span className="font-display text-xl font-bold text-white sm:text-2xl">{rating!.rating!.toFixed(1)}/5</span>
              <Star size={19} fill="currentColor" className="text-amber-400" aria-hidden />
              <span className="text-xs text-bm-copy">{rating!.userRatingCount} {ui.reviews}</span>
            </span>
          ) : (
            <span className="text-sm font-semibold text-bm-copy">{ui.view}</span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-bm-accent sm:text-sm">
            <BadgeCheck size={17} aria-hidden /><ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
      </div>
    </section>
  );
}
