"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { getRelatedLandingLinks } from "@/lib/seo-landing-related";

type Props = { slug: string };

export function SeoLandingRelatedLinks({ slug }: Props) {
  const { t } = useI18n();
  const links = getRelatedLandingLinks(slug);
  if (!links.length) return null;

  return (
    <section className="mt-10 rounded-xl border border-bm-border/50 bg-bm-card/20 p-5 sm:p-6">
      <h2 className="font-display text-lg uppercase text-glow mb-4">
        {t.serviceLanding.relatedServicesTitle}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {links.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/${item.slug}`}
              className="inline-block px-3 py-2 rounded-lg border border-bm-border text-sm hover:border-bm-red hover:text-bm-red transition-colors"
            >
              {item.title}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/services"
            className="inline-block px-3 py-2 rounded-lg border border-bm-red/40 text-sm text-bm-red hover:bg-bm-red/10 transition-colors"
          >
            {t.seoLanding.allServices}
          </Link>
        </li>
      </ul>
    </section>
  );
}
