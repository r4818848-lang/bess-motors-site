import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Galeria — realizacje serwisu",
  description:
    "Galeria prac BESS MOTORS — naprawy, tuning, wulkanizacja i serwis samochodowy w Warszawie. Zdjęcia przed i po.",
  path: "/gallery",
});

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
