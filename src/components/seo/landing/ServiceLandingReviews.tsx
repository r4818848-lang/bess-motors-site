"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import { siteConfig } from "@/lib/site";
import type { ServiceId } from "@/lib/services-catalog";

type ApiRating = {
  id: string;
  stars: number;
  comment?: string;
  clientName: string;
  tag?: string;
};

const FALLBACK = [
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

export function ServiceLandingReviews({ serviceId }: { serviceId?: ServiceId }) {
  const { locale, t } = useI18n();
  const sl = t.serviceLanding;
  const useRu = contentLocale(locale) === "ru";
  const [apiReviews, setApiReviews] = useState<ApiRating[]>([]);

  useEffect(() => {
    fetch("/api/ratings")
      .then((r) => r.json())
      .then((data: { ratings?: ApiRating[] }) => setApiReviews(data.ratings ?? []))
      .catch(() => setApiReviews([]));
  }, []);

  const cards = useMemo(() => {
    const fromApi = apiReviews.slice(0, 3).map((r) => ({
      name: r.clientName,
      text: r.comment?.trim() || (useRu ? "Polecam serwis." : "Polecam serwis."),
      key: r.id,
    }));
    if (fromApi.length >= 3) return fromApi;
    const fallback = FALLBACK.map((r) => ({
      name: r.name,
      text: useRu ? r.textRu : r.textPl,
      key: r.name,
    }));
    return [...fromApi, ...fallback].slice(0, 3);
  }, [apiReviews, useRu]);

  const avgStars =
    apiReviews.length > 0
      ? apiReviews.reduce((s, r) => s + r.stars, 0) / apiReviews.length
      : 5;

  return (
    <section className="mt-12" aria-labelledby="landing-reviews-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="landing-reviews-heading" className="font-display text-xl uppercase">
            {t.googleReviews.title}
          </h2>
          <p className="text-sm text-bm-muted mt-1 flex flex-wrap items-center gap-2">
            <span className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.round(avgStars) ? "currentColor" : "none"}
                  className={i < Math.round(avgStars) ? "" : "opacity-30"}
                />
              ))}
            </span>
            {apiReviews.length > 0
              ? sl.reviewsFromClients.replace("{count}", String(apiReviews.length))
              : sl.reviewsHint}
            {serviceId ? (
              <span className="text-bm-muted/80">· {sl.reviewsServiceHint}</span>
            ) : null}
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
        {cards.map((r) => (
          <article key={r.key} className="glass rounded-xl p-5 border border-bm-border/40">
            <div className="flex gap-1 text-amber-400 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm text-bm-silver">{r.text}</p>
            <p className="text-xs text-bm-muted mt-3">{r.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
