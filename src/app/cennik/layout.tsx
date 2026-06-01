import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cennik — pełny cennik serwisu",
  description:
    "Oficjalny cennik BESS MOTORS Warszawa: diagnostyka, olej, hamulce, zawieszenie, silnik, DSG, klimatyzacja, chip tuning. Norma-godzina 250 zł.",
  path: "/cennik",
  keywords: ["cennik serwis samochodowy Warszawa", "ceny wymiana oleju", "chip tuning cena"],
});

export default function CennikLayout({ children }: { children: React.ReactNode }) {
  return children;
}
