import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Rezerwacja przyjęta",
  robots: { index: false, follow: false },
  alternates: { canonical: `${getSiteUrl()}/booking/thank-you` },
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
