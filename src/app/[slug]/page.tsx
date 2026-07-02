import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPageView } from "@/components/seo/SeoLandingPageView";
import { StructuredData } from "@/components/seo/StructuredData";
import {
  getSeoLandingPage,
  seoLandingSlugs,
} from "@/lib/seo-landing-pages";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { autoRepairServiceSchema } from "@/lib/seo-structured-data";
import { acPromoSeoKeywords } from "@/lib/ac-recharge-promo-seo";
import { AC_PROMO_HERO_SRC } from "@/lib/ac-media";
import { OIL_CHANGE_DRAIN_POSTER_SRC } from "@/lib/oil-media";
import { ALTERNATOR_INSTALL_PHOTO_SRC } from "@/lib/alternator-media";
import { BRAKE_PADS_CHANGE_PHOTO_SRC } from "@/lib/brake-media";
import { TIRE_SERVICE_POSTER_SRC } from "@/lib/tire-media";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoLandingSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);
  if (!page) return {};

  const cityKw = "Warszawa";
  const acKeywords =
    slug === "klimatyzacja"
      ? [
          ...acPromoSeoKeywords,
          "nabijanie klimatyzacji Warszawa",
          "serwis klimatyzacji samochodowej",
          "klimatyzacja samochodowa Włochy",
          "R134a Warszawa",
          "R1234yf Warszawa",
          "odgrzybianie klimatyzacji",
          "próżniowanie klimatyzacji",
        ]
      : [];

  return buildPageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
    ogImage:
      slug === "klimatyzacja"
        ? AC_PROMO_HERO_SRC
        : slug === "wymiana-oleju"
          ? OIL_CHANGE_DRAIN_POSTER_SRC
          : slug === "opony" || slug === "geometria"
            ? TIRE_SERVICE_POSTER_SRC
            : slug === "hamulce" || slug === "klocki-hamulcowe"
              ? BRAKE_PADS_CHANGE_PHOTO_SRC
              : slug === "elektryka"
                ? ALTERNATOR_INSTALL_PHOTO_SRC
                : undefined,
    keywords: [
      page.metaTitle,
      page.title,
      `${page.title} ${cityKw}`,
      page.line1,
      `${page.line2} ${cityKw}`,
      "BESS MOTORS",
      "serwis samochodowy Warszawa",
      "warsztat samochodowy Włochy",
      "Aleja Krakowska 48/52",
      page.slug.replace(/-/g, " "),
      ...acKeywords,
    ],
  });
}

export default async function SeoLandingRoute({ params }: Props) {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);
  if (!page) notFound();

  return (
    <>
      <StructuredData data={autoRepairServiceSchema(page)} />
      <SeoLandingPageView page={page} />
    </>
  );
}
