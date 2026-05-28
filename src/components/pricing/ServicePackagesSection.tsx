"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { servicePackages } from "@/lib/service-packages";
import { BookingLink } from "@/components/analytics/BookingLink";

export function ServicePackagesSection() {
  const { locale } = useI18n();

  return (
    <section className="mt-12 space-y-4">
      <h2 className="font-display text-xl uppercase text-glow">
        {locale === "ru" ? "Пакеты услуг" : locale === "en" ? "Service packages" : "Pakiety usług"}
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {servicePackages.map((p) => (
          <div key={p.id} className="glass-red rounded-xl p-5 neon-border">
            <h3 className="font-bold">{locale === "ru" ? p.nameRu : p.namePl}</h3>
            <p className="text-xs text-bm-muted mt-2">
              {p.serviceIds.length}{" "}
              {locale === "ru" ? "услуг" : "usług"}
            </p>
            <BookingLink
              href={`/booking?package=${p.id}`}
              className="btn-primary text-xs mt-4 inline-block"
              trackSource="package"
            >
              {locale === "ru" ? "Записаться" : "Umów"}
            </BookingLink>
          </div>
        ))}
      </div>
      <p className="text-xs text-bm-muted">
        {locale === "ru" ? "Те же пакеты в " : "Te same pakiety w "}
        <Link href="https://t.me/BessMotors_bot" className="text-bm-red hover:underline">
          Telegram
        </Link>
      </p>
    </section>
  );
}
