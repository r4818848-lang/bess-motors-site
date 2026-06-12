import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { localSeoKeywords } from "@/lib/seo-local";

export const metadata: Metadata = buildPageMetadata({
  title: "Kontakt — adres i telefon",
  description:
    "Kontakt BESS MOTORS: Aleja Krakowska 48/52, 02-284 Warszawa (Włochy). Obszar obsługi ok. 8 km: Ursynów, Mokotów, Ochota, Okęcie. Tel. +48 791 257 229. Pn–Sb 8:00–18:00.",
  path: "/contacts",
  keywords: [
    "kontakt serwis Warszawa",
    "BESS MOTORS adres",
    "mechanik Włochy",
    "warsztat Aleja Krakowska",
    ...localSeoKeywords.slice(0, 8),
  ],
});

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
