"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import { siteConfig } from "@/lib/site";

const REVIEWS = [
  {
    name: "Marek K.",
    textPl: "Szybka diagnostyka i uczciwa wycena — polecam BESS MOTORS.",
    textRu: "Быстрая диагностика и честная смета — рекомендую BESS MOTORS.",
  },
  {
    name: "Anna W.",
    textPl: "Wymiana oleju w godzinę, profesjonalna obsługa i czysta strefa oczekiwania.",
    textRu: "Замена масла за час, профессионально и удобная зона ожидания.",
  },
  {
    name: "Oleg P.",
    textPl: "Hamulce i geometria — wszystko na czas, bez naciągania.",
    textRu: "Тормоза и развал — всё в срок, без лишних работ.",
  },
];

export function ServiceLandingReviews() {
  const { locale, t } = useI18n();
  const sl = t.serviceLanding;
  const useRu = contentLocale(locale) === "ru";

  return (
    <section className="mt-12" aria-labelledby="landing-reviews-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="landing-reviews-heading" className="font-display text-xl uppercase">
            {t.googleReviews.title}
          </h2>
          <p className="text-sm text-bm-muted mt-1 flex items-center gap-2">
            <span className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </span>
            {sl.reviewsHint}
          </p>
        </div>
        <Link
          href={siteConfig.googleMapsReviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline text-sm"
        >
          Google Maps
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {REVIEWS.map((r) => (
          <article key={r.name} className="glass rounded-xl p-5 border border-bm-border/40">
            <div className="flex gap-1 text-amber-400 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm text-bm-silver">{useRu ? r.textRu : r.textPl}</p>
            <p className="text-xs text-bm-muted mt-3">{r.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
