import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";
import {
  oilBrakePromoMetaDescriptionPl,
  OIL_BRAKE_PROMO_CODE,
} from "@/lib/oil-brake-promo";

export const metadata: Metadata = buildPageMetadata({
  title: `Promocje — olej, hamulce, klima · kod ${OIL_BRAKE_PROMO_CODE}`,
  description: oilBrakePromoMetaDescriptionPl(),
  path: "/promocje",
  keywords: [
    "promocja wymiana oleju Warszawa",
    "klocki hamulcowe promocja",
    "kod BessMotors",
    "wymiana oleju 100 zł",
  ],
});

export default function PromocjeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
