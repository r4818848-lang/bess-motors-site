import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";
import {
  OIL_BRAKE_PROMO_CODE,
} from "@/lib/oil-brake-promo";

export const metadata: Metadata = buildPageMetadata({
  title: `Promocje — olej, hamulce · kod ${OIL_BRAKE_PROMO_CODE}`,
  description: `Promocje BESS MOTORS Warszawa Włochy: wymiana oleju, hamulce i klimatyzacja. Sprawdź aktualne warunki i kod ${OIL_BRAKE_PROMO_CODE}.`,
  path: "/promocje",
  keywords: [
    "promocja wymiana oleju Warszawa",
    "wymiana oleju 80 zł",
    "klocki hamulcowe promocja",
    "kod BessMotors",
  ],
});

export default function PromocjeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
