"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import {
  getModelCaseBySlug,
  getModelHeroForSlug,
  MODEL_TIRE_SLUGS,
} from "@/lib/model-service-media";

/** Large workshop photo + cross-links to related model services */
export function ModelServiceHero({ slug }: { slug: string }) {
  const { locale } = useI18n();
  const lang = contentLocale(locale);
  const hero = getModelHeroForSlug(slug);
  const model = getModelCaseBySlug(slug);
  if (!hero || !model) return null;

  const isTire = MODEL_TIRE_SLUGS.has(slug);
  const siblingHref = isTire ? `/${model.brakeSlug}` : `/${model.tireSlug}`;
  const siblingLabel = isTire
    ? lang === "ru"
      ? `Колодки ${model.label}`
      : `Klocki ${model.label}`
    : lang === "ru"
      ? `Шиномонтаж ${model.label}`
      : `Opony ${model.label}`;

  const related =
    lang === "ru"
      ? [
          { href: "/sezonowa-wymiana-opon-warszawa", label: "Сезонная замена шин" },
          { href: "/wywazanie-kol-warszawa", label: "Балансировка" },
          { href: "/hamulce-warszawa", label: "Тормоза Warszawa" },
          { href: `/${model.brandHubSlug}`, label: model.brand },
        ]
      : [
          { href: "/sezonowa-wymiana-opon-warszawa", label: "Sezonowa wymiana opon" },
          { href: "/wywazanie-kol-warszawa", label: "Wyważanie kół" },
          { href: "/hamulce-warszawa", label: "Hamulce Warszawa" },
          { href: `/${model.brandHubSlug}`, label: model.brand },
        ];

  return (
    <div className="mt-10 space-y-4">
      <div className="relative aspect-[16/10] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 bg-bm-surface/40">
        <Image
          src={hero.src}
          alt={hero.alt[lang] ?? hero.alt.pl}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority
        />
      </div>
      <div className="flex flex-wrap gap-2 justify-center text-sm">
        <Link
          href={siblingHref}
          className="rounded-lg border border-bm-red/40 bg-bm-red/10 px-3 py-1.5 text-bm-red hover:bg-bm-red/20 transition-colors"
        >
          {siblingLabel}
        </Link>
        {related.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-bm-silver hover:border-bm-red/40 hover:text-white transition-colors"
          >
            {r.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
