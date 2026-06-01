import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "O nas — warsztat samochodowy",
  description:
    "BESS MOTORS — warsztat samochodowy w Warszawie Włochy. Doświadczenie, nowoczesny sprzęt, chip tuning i serwis kompleksowy na Alei Krakowskiej.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
