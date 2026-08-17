import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Program poleceń — rabaty",
  description:
    "Poleć znajomego do BESS MOTORS i odbierz rabat. Program poleceń warsztatu samochodowego w Warszawie.",
  path: "/referral",
  noIndex: true,
});

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return children;
}
