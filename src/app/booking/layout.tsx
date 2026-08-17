import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Zapis online — olej, hamulce, klima",
  description:
    "Zapis online BESS MOTORS Warszawa: wybierz usługę i zostaw telefon. Wymiana oleju 100 zł, klocki od 100 zł (kod BessMotors), nabijanie klimatyzacji −50%. Aleja Krakowska 48/52.",
  path: "/booking",
  keywords: [
    "zapis online serwis Warszawa",
    "rezerwacja warsztat Włochy",
    "wymiana oleju zapis",
  ],
});

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
