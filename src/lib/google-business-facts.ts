import { siteConfig } from "@/lib/site";
import { businessConfig } from "@/lib/businessConfig";
import { WORKSHOP_PHOTOS } from "@/lib/workshop-photos";
import { getSiteUrl } from "@/lib/seo";
import { acRechargeFromPln } from "@/lib/ac-recharge-prices";
import { OIL_BRAKE_PROMO_CODE, OIL_BRAKE_PROMO_OFFERS } from "@/lib/oil-brake-promo";

/**
 * Canonical facts for Google Business Profile + the website.
 * Keep GBP hours, NAP, photos and labour prices identical to businessConfig.
 */
export const GBP_HOURS_SHORT = businessConfig.workingHoursLabel;

export const GBP_OPENING_HOURS = {
  days: businessConfig.openingHours.days,
  opens: businessConfig.openingHours.opens,
  closes: businessConfig.openingHours.closes,
};

export function gbpPhotoUrls(siteUrl = getSiteUrl()): string[] {
  return [
    `${siteUrl}${siteConfig.logoImage}`,
    `${siteUrl}${siteConfig.bannerImage}`,
    ...WORKSHOP_PHOTOS.map((p) => `${siteUrl}${p.src}`),
  ];
}

export function gbpKeyPricesPl(): string[] {
  const oil = OIL_BRAKE_PROMO_OFFERS.find((o) => o.id === "oil_filter");
  const pads = OIL_BRAKE_PROMO_OFFERS.find((o) => o.id === "brake_pads_front");
  return [
    `Wymiana oleju + filtr: ${oil?.nowZl ?? 100} zł robocizna (kod ${OIL_BRAKE_PROMO_CODE})`,
    `Klocki hamulcowe przód: ${pads?.nowZl ?? 100} zł robocizna (kod ${OIL_BRAKE_PROMO_CODE})`,
    `Nabijanie klimatyzacji: od ${acRechargeFromPln()} zł`,
    `Godziny: ${GBP_HOURS_SHORT}`,
    `Adres: ${siteConfig.address}`,
    `Telefon: ${siteConfig.phone}`,
  ];
}
