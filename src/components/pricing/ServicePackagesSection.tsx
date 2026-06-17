"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import {
  buildPackageBookingUrl,
  packageRegularTotal,
  servicePackages,
} from "@/lib/service-packages";
import { BookingLink } from "@/components/analytics/BookingLink";
import { formatPln } from "@/lib/booking-cart";

export function ServicePackagesSection() {
  const { locale, t } = useI18n();
  const p = t.servicePackages;
  const useRu = contentLocale(locale) === "ru";

  return (
    <section className="mt-12 space-y-4">
      <h2 className="font-display text-xl uppercase text-glow">{p.title}</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {servicePackages.map((pkg) => {
          const regular = packageRegularTotal(pkg);
          const savings = regular - pkg.packagePricePln;
          return (
            <div key={pkg.id} className="glass-red rounded-xl p-5 neon-border">
              <h3 className="font-bold">{useRu ? pkg.nameRu : pkg.namePl}</h3>
              <p className="text-xs text-bm-muted mt-2">
                {pkg.priceItemIds.length} {p.servicesCount}
              </p>
              <div className="mt-4 space-y-1">
                <p className="text-xs uppercase text-bm-muted">{p.packagePrice}</p>
                <p className="font-display text-2xl font-bold text-bm-red">
                  {formatPln(pkg.packagePricePln)}
                </p>
                <p className="text-xs text-bm-muted">
                  {p.regularPrice}:{" "}
                  <span className="line-through">{formatPln(regular)}</span>
                  {savings > 0 && (
                    <span className="text-emerald-400 ml-1">
                      (−{formatPln(savings)})
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-bm-muted/80">
                  {p.validUntil}: {pkg.validUntil}
                </p>
              </div>
              <BookingLink
                href={buildPackageBookingUrl(pkg)}
                className="btn-primary text-xs mt-4 inline-block w-full text-center"
                trackSource="package"
              >
                {p.book}
              </BookingLink>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-bm-muted">
        {p.telegramHint}
        <Link href="https://t.me/BessMotors_bot" className="text-bm-red hover:underline">
          Telegram
        </Link>
      </p>
    </section>
  );
}
