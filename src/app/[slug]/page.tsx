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
          "nabijanie klimatyzacji Warszawa",
          "serwis klimatyzacji samochodowej",
          "klimatyzacja samochodowa Włochy",
          "podłączenie klimatyzacji 50 zł",
          "freon R134a 60 zł",
          "R134a Warszawa",
          "R1234yf Warszawa",
          "заправка кондиционера Варшава",
          "заправка автокондиционера",
          "odgrzybianie klimatyzacji",
          "próżniowanie klimatyzacji",
        ]
      : [];

  return buildPageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
    ogImage: slug === "klimatyzacja" ? "/images/works/ac-service-cover.png" : undefined,
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
