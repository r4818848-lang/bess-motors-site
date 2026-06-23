"use client";

import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { ServiceId } from "@/lib/services-catalog";
import {
  buildPackageBookingUrl,
  getServicePackage,
  packageRegularTotal,
  type ServicePackageId,
} from "@/lib/service-packages";
import { BookingLink } from "@/components/analytics/BookingLink";
import { formatPln } from "@/lib/booking-cart";

const LANDING_PACKAGES: Partial<Record<ServiceId, ServicePackageId>> = {
  oil: "to_standard",
  filters: "to_standard",
  brakePads: "brake_check",
  brakesFull: "brake_check",
  tires: "winter_prep",
  acRefill: "summer_ac",
  acRepair: "summer_ac",
};

export function ServiceLandingPackageOffer({ serviceId }: { serviceId: ServiceId }) {
  const { locale, t } = useI18n();
  const p = t.servicePackages;
  const useRu = contentLocale(locale) === "ru";
  const packageId = LANDING_PACKAGES[serviceId];
  const pkg = packageId ? getServicePackage(packageId) : undefined;
  if (!pkg) return null;

  const regular = packageRegularTotal(pkg);
  const savings = regular - pkg.packagePricePln;

  return (
    <section className="mt-8" aria-labelledby="landing-package-heading">
      <h2 id="landing-package-heading" className="font-display text-sm uppercase text-bm-red mb-3">
        {p.title}
      </h2>
      <div className="glass-red rounded-xl p-5 neon-border">
        <h3 className="font-bold">{useRu ? pkg.nameRu : pkg.namePl}</h3>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs uppercase text-bm-muted">{p.packagePrice}</p>
            <p className="font-display text-2xl font-bold text-bm-red">
              {formatPln(pkg.packagePricePln)}
            </p>
          </div>
          <div className="text-sm text-bm-muted">
            {p.regularPrice}:{" "}
            <span className="line-through">{formatPln(regular)}</span>
            {savings > 0 && (
              <span className="text-emerald-400 ml-1">(−{formatPln(savings)})</span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-bm-muted/80 mt-2">
          {p.validUntil}: {pkg.validUntil}
        </p>
        <BookingLink
          href={buildPackageBookingUrl(pkg)}
          className="btn-primary text-xs mt-4 inline-block"
          trackSource={`landing_pkg_${pkg.id}`}
        >
          {p.book}
        </BookingLink>
      </div>
    </section>
  );
}
