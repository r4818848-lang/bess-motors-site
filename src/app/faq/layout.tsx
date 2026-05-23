import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "FAQ — częste pytania",
  description:
    "BESS MOTORS Warszawa — pytania o wymianę oleju, chip tuning, wulkanizację, ceny i rezerwację online.",
  alternates: { canonical: `${siteUrl}/faq` },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
