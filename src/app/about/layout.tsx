import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "O nas — warsztat Warszawa Włochy",
  description:
    "BESS MOTORS — niezależny warsztat samochodowy w Warszawie Włochy, Aleja Krakowska 48/52. Olej, hamulce, klimatyzacja i diagnostyka. Pn–Pt 9:00–18:00, Sb 9:00–14:00, Nd zamknięte.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
