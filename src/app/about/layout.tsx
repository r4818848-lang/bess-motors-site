import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "O nas",
  description: "BESS MOTORS — warsztat samochodowy w Warszawie. Doświadczenie, nowoczesny sprzęt, chip tuning i serwis kompleksowy.",
  alternates: { canonical: `${siteUrl}/about` },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
