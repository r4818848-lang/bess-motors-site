"use client";

import { useI18n } from "@/lib/i18n/context";
import type { User, Vehicle, WorkOrder } from "@/lib/store";
import { downloadWarrantyCertificate } from "@/lib/warranty-pdf";
import { Card } from "@/components/ui/Card";
import { BookingLink } from "@/components/analytics/BookingLink";

function daysLeft(until: string): number {
  const end = new Date(until);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function WarrantyCountdown({
  orders,
  user,
  vehicles,
}: {
  orders: WorkOrder[];
  user?: User;
  vehicles?: Vehicle[];
}) {
  const { locale } = useI18n();
  const active = orders
    .filter((o) => o.warrantyUntil && daysLeft(o.warrantyUntil) > 0)
    .sort((a, b) => (a.warrantyUntil ?? "").localeCompare(b.warrantyUntil ?? ""));

  if (!active.length) return null;

  const title =
    locale === "ru" || locale === "uk"
      ? "Гарантия"
      : locale === "en"
        ? "Warranty"
        : "Gwarancja";

  const claim =
    locale === "ru" || locale === "uk"
      ? "Гарантийное обращение"
      : locale === "en"
        ? "Warranty claim"
        : "Reklamacja gwarancyjna";

  return (
    <Card className="p-6 mb-6">
      <h3 className="font-display uppercase text-sm mb-4">{title}</h3>
      <ul className="space-y-3">
        {active.map((o) => {
          const d = daysLeft(o.warrantyUntil!);
          return (
            <li key={o.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-bm-border/30 pb-3">
              <span>
                <b className="text-bm-red">{o.number}</b> — {d}{" "}
                {locale === "ru" || locale === "uk" ? "дн." : locale === "en" ? "days left" : "dni"}
              </span>
              <span className="flex gap-3">
                {user && vehicles && (
                  <button
                    type="button"
                    className="text-bm-muted text-xs hover:text-white"
                    onClick={() => {
                      const v = vehicles.find((x) => x.id === o.vehicleId);
                      if (v) void downloadWarrantyCertificate(o, v, user);
                    }}
                  >
                    PDF
                  </button>
                )}
                <BookingLink
                  trackSource="warranty_claim"
                  className="text-bm-red text-xs font-bold uppercase"
                  href={`/booking?comment=${encodeURIComponent(`Gwarancja ${o.number}`)}`}
                >
                  {claim}
                </BookingLink>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
