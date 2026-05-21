import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Usługi — wulkanizacja, klimatyzacja, tuning",
  description:
    "Usługi BESS MOTORS Warszawa: wymiana opon, klimatyzacja, wymiana oleju, hamulce, chip tuning, diagnostyka. Cennik i zapis online.",
  alternates: { canonical: `${siteUrl}/services` },
  openGraph: {
    title: "Usługi | BESS MOTORS",
    url: `${siteUrl}/services`,
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
