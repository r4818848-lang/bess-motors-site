import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Serwis flot samochodowych Warszawa",
  description:
    "Serwis samochodów firmowych i flot — BESS MOTORS Warszawa Włochy. Przeglądy, olej, hamulce, opony, diagnostyka, klimatyzacja, fakturowanie. Aleja Krakowska 48/52.",
  path: "/serwis-flot-warszawa",
  keywords: [
    "serwis flot Warszawa",
    "serwis samochodów firmowych Warszawa",
    "warsztat flotowy Włochy",
  ],
});

export default function FleetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
