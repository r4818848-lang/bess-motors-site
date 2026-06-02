import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Zapis online i cennik",
  description:
    "Zapis na serwis BESS MOTORS online z aktualnym cennikiem. Wulkanizacja, olej, hamulce, klimatyzacja, chip tuning — Warszawa Aleja Krakowska.",
  path: "/booking",
  keywords: ["zapis online serwis", "rezerwacja warsztat Warszawa", "cennik serwis"],
});

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
