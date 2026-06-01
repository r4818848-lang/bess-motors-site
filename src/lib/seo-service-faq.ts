import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingFaq } from "@/lib/service-landing-content";

/** Polish FAQ for FAQPage schema on landing pages */
export function getServiceFaqForSchema(
  serviceId?: ServiceId,
  slug?: string
): { q: string; a: string }[] {
  if (!serviceId) return [];
  return getServiceLandingFaq(serviceId, slug).map((item) => ({
    q: item.q.pl,
    a: item.a.pl,
  }));
}

/** @deprecated Use getServiceLandingFaq — kept for imports */
export const SEO_SERVICE_FAQ_PL: Partial<
  Record<ServiceId, { q: string; a: string }[]>
> = {};
