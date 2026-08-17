import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "O nas — warsztat Warszawa Włochy",
  description:
    "BESS MOTORS — niezależny warsztat samochodowy w Warszawie Włochy, Aleja Krakowska 48/52. Olej, hamulce, klimatyzacja, diagnostyka i chip tuning. Pn–Sb 8:00–18:00.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
