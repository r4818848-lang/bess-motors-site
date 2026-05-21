import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Zapis online i cennik",
  description:
    "Zapis na serwis BESS MOTORS online z oficjalnym cennikiem. Wulkanizacja, olej, hamulce, klimatyzacja — Warszawa Aleja Krakowska.",
  alternates: { canonical: `${siteUrl}/booking` },
  openGraph: {
    title: "Zapis online | BESS MOTORS",
    url: `${siteUrl}/booking`,
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
