import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Galeria — realizacje serwisu",
  description:
    "Galeria BESS MOTORS — zdjęcia warsztatu, wideo z prac, naprawy przed i po. Serwis samochodowy Warszawa.",
  path: "/gallery",
});

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
