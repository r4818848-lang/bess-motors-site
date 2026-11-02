/**
 * Central NAP / business facts — thin wrapper over businessConfig.
 * Prefer `businessConfig` for new code; SITE_NAP kept for existing imports.
 */
export {
  siteConfig,
  sitePartners,
  bannerServices,
} from "@/lib/site";

import { businessConfig, isWithinBusinessHours } from "@/lib/businessConfig";

export const SITE_NAP = {
  name: businessConfig.name,
  legalName: businessConfig.legalName,
  phoneDisplay: businessConfig.phoneDisplay,
  phoneHref: businessConfig.phoneHref,
  phoneE164: businessConfig.phoneE164,
  email: businessConfig.email,
  streetAddress: businessConfig.streetAddress,
  postalCode: businessConfig.postalCode,
  addressLocality: businessConfig.addressLocality,
  addressRegion: businessConfig.addressRegion,
  addressCountry: businessConfig.addressCountry,
  addressLine: businessConfig.addressLine,
  district: businessConfig.district,
  nearLandmark: businessConfig.nearLandmark,
  workingHoursLabel: businessConfig.workingHoursLabel,
  openingHours: {
    days: businessConfig.openingHours.days,
    opens: businessConfig.openingHours.opens,
    closes: businessConfig.openingHours.closes,
  },
  priceRange: businessConfig.priceRange,
  paymentAccepted: businessConfig.paymentAccepted,
  whatsappUrl: businessConfig.whatsappUrl,
  telegramUrl: businessConfig.telegramUrl,
  instagramUrl: businessConfig.instagramUrl,
  facebookUrl: businessConfig.facebookUrl,
} as const;

export function isWithinOpeningHoursSpec(now = new Date()): boolean {
  return isWithinBusinessHours(now);
}

export { businessConfig };
