import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Cennik — pełny cennik serwisu",
  description:
    "Oficjalny cennik BESS MOTORS Warszawa: diagnostyka, olej, hamulce, zawieszenie, silnik, DSG, klimatyzacja, chip tuning. Norma-godzina 250 zł.",
  alternates: { canonical: `${siteUrl}/cennik` },
  openGraph: {
    title: "Cennik BESS MOTORS",
    description: "Pełny cennik usług serwisu samochodowego — Warszawa, Aleja Krakowska.",
    url: `${siteUrl}/cennik`,
  },
};

export default function CennikLayout({ children }: { children: React.ReactNode }) {
  return children;
}
