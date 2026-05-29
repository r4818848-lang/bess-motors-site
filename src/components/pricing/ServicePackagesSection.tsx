"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale, pickName } from "@/lib/i18n/locale-utils";
import { servicePackages } from "@/lib/service-packages";
import { BookingLink } from "@/components/analytics/BookingLink";

export function ServicePackagesSection() {
  const { locale, t } = useI18n();
  const p = t.servicePackages;
  const useRu = contentLocale(locale) === "ru";

  return (
    <section className="mt-12 space-y-4">
      <h2 className="font-display text-xl uppercase text-glow">{p.title}</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {servicePackages.map((pkg) => (
          <div key={pkg.id} className="glass-red rounded-xl p-5 neon-border">
            <h3 className="font-bold">{useRu ? pkg.nameRu : pkg.namePl}</h3>
            <p className="text-xs text-bm-muted mt-2">
              {pkg.serviceIds.length} {p.servicesCount}
            </p>
            <BookingLink
              href={`/booking?package=${pkg.id}`}
              className="btn-primary text-xs mt-4 inline-block"
              trackSource="package"
            >
              {p.book}
            </BookingLink>
          </div>
        ))}
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
