import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPageView } from "@/components/seo/SeoLandingPageView";
import {
  getSeoLandingPage,
  seoLandingSlugs,
} from "@/lib/seo-landing-pages";
import { getSiteUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoLandingSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);
  if (!page) return {};

  const siteUrl = getSiteUrl();
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `${siteUrl}/${page.slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${siteUrl}/${page.slug}`,
    },
  };
}

export default async function SeoLandingRoute({ params }: Props) {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);
  if (!page) notFound();

  return <SeoLandingPageView page={page} />;
}
