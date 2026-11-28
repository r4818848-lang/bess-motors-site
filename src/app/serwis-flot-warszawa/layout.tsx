import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Serwis flot samochodowych Warszawa",
  description:
    "Serwis flot Warszawa Włochy: przeglądy, olej, hamulce, opony, diagnostyka i klimatyzacja. Fakturowanie. Aleja Krakowska 48/52.",
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
