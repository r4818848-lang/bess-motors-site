import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Program poleceń — rabaty",
  description:
    "Poleć znajomego do BESS MOTORS i odbierz rabat. Program poleceń warsztatu samochodowego w Warszawie — szczegóły i warunki.",
  path: "/referral",
  keywords: ["program poleceń", "rabat serwis", "BESS MOTORS Warszawa"],
});

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return children;
}
