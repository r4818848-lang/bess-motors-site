import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "O nas — warsztat Warszawa Włochy",
  description:
    "BESS MOTORS — warsztat Warszawa Włochy, Aleja Krakowska 48/52. Olej, hamulce, klimatyzacja, diagnostyka. Pn–Pt 9–18, Sb 9–14.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
