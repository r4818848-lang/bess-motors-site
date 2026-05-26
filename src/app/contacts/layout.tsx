import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakt BESS MOTORS: Aleja Krakowska 48/52 Warszawa, tel. +48 791 257 229. Godziny Pn–Sb 8:00–20:00. Mapa i zapis online.",
  alternates: { canonical: `${siteUrl}/contacts` },
};

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
