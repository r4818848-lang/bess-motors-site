import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Kontakt — adres i telefon",
  description:
    "Kontakt BESS MOTORS: Aleja Krakowska 48/52, 02-284 Warszawa. Tel. +48 791 257 229, WhatsApp, Telegram. Pn–Sb 8:00–20:00.",
  path: "/contacts",
  keywords: ["kontakt serwis Warszawa", "BESS MOTORS adres", "mechanik Włochy"],
});

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
