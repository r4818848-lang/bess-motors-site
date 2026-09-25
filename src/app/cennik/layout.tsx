import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cennik — olej 80 zł, hamulce od 100 zł",
  description:
    "Cennik BESS MOTORS Warszawa: wymiana oleju 80 zł + zawieszenie gratis przy oleju (kod BessMotors), klocki od 100 zł. Aleja Krakowska 48/52.",
  path: "/cennik",
  keywords: [
    "cennik serwis samochodowy Warszawa",
    "wymiana oleju 80 zł",
    "wymiana oleju Warszawa",
    "klocki hamulcowe cena Warszawa",
    "chip tuning cena",
  ],
});

export default function CennikLayout({ children }: { children: React.ReactNode }) {
  return children;
}
