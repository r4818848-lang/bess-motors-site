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

  return buildPageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
    keywords: [
      page.metaTitle,
      "BESS MOTORS",
      "serwis samochodowy Warszawa",
      "Aleja Krakowska",
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
