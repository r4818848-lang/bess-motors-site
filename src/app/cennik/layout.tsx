import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cennik — olej 100 zł, hamulce od 100 zł",
  description:
    "Cennik BESS MOTORS Warszawa: wymiana oleju 100 zł (kod BessMotors), klocki od 100 zł, nabijanie klimy −50%. Diagnostyka, zawieszenie, DSG, chip tuning. Norma-godzina 250 zł. Aleja Krakowska 48/52.",
  path: "/cennik",
  keywords: [
    "cennik serwis samochodowy Warszawa",
    "wymiana oleju 100 zł",
    "klocki hamulcowe cena Warszawa",
    "chip tuning cena",
  ],
});

export default function CennikLayout({ children }: { children: React.ReactNode }) {
  return children;
}
