import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Galeria",
  description: "Galeria prac serwisu BESS MOTORS — Warszawa.",
  alternates: { canonical: `${siteUrl}/gallery` },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
