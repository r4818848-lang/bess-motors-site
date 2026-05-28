"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";

const REVIEWS = [
  { name: "Marek K.", textPl: "Szybka diagnostyka i uczciwa wycena.", textRu: "Быстрая диагностика и честная смета." },
  { name: "Anna W.", textPl: "Polecam — profesjonalna obsługa.", textRu: "Рекомендую — профессиональный сервис." },
  { name: "Oleg P.", textPl: "Naprawa hamulców na czas.", textRu: "Тормоза сделали в срок." },
];

export function GoogleReviewsBlock() {
  const { locale } = useI18n();

  return (
    <section className="py-16 border-t border-bm-border/30">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="font-display text-2xl uppercase text-glow">
            {locale === "ru" ? "Отзывы клиентов" : "Opinie klientów"}
          </h2>
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
            <article key={r.name} className="glass rounded-xl p-5">
              <div className="flex gap-1 text-amber-400 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-bm-silver">
                {locale === "ru" ? r.textRu : r.textPl}
              </p>
              <p className="text-xs text-bm-muted mt-3">{r.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
