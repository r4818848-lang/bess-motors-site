"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingPrice } from "@/lib/service-landing-content";
import { pickLocalized } from "@/lib/service-landing-locale";
import { Card } from "@/components/ui/Card";
import { Check } from "lucide-react";

export function ServiceLandingPrice({
  serviceId,
  slug,
}: {
  serviceId: ServiceId;
  slug: string;
}) {
  const { t, locale } = useI18n();
  const sl = t.serviceLanding;
  const price = getServiceLandingPrice(serviceId, slug);
  if (!price) return null;

  return (
    <section className="mt-12" aria-labelledby="landing-price-heading">
      <h2 id="landing-price-heading" className="font-display text-xl uppercase mb-4">
        {sl.priceTitle}
      </h2>
      <Card glow className="p-6">
        {price.fromZl <= 0 && !price.priceFrom ? (
          <p className="font-display text-2xl text-bm-red">{sl.priceOnRequest}</p>
        ) : (
          <p className="font-display text-3xl text-bm-red">
            {price.priceFrom ? sl.from : ""}{" "}
            <span className="text-white">{price.fromZl}</span> zł
          </p>
        )}
        {price.note && (
          <p className="text-sm text-bm-muted mt-2">{pickLocalized(price.note, locale)}</p>
        )}
        {price.priceTable && price.priceTable.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-lg border border-bm-border/50">
            <table className="w-full text-sm min-w-[280px]">
              <thead>
                <tr className="bg-bm-surface/80 text-xs uppercase">
                  <th className="p-2 text-left">{sl.priceTableSize}</th>
                  <th className="p-2 text-right">{sl.priceTablePrice}</th>
                </tr>
              </thead>
              <tbody>
                {price.priceTable.map((row) => (
                  <tr key={row.label.pl} className="border-t border-bm-border/30">
                    <td className="p-2">{pickLocalized(row.label, locale)}</td>
                    <td className="p-2 text-right text-bm-red font-semibold whitespace-nowrap">
                      {row.compareAtZl != null ? (
                        <span className="line-through text-bm-muted font-normal text-xs mr-2">
                          {row.compareAtZl} zł
                        </span>
                      ) : null}
                      {row.priceFrom ? `${sl.from} ` : ""}
                      {row.priceZl} zł
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ul className="mt-5 space-y-2">
          {price.includes.map((item) => (
            <li key={item.pl} className="flex gap-2 text-sm">
              <Check className="w-4 h-4 text-bm-red shrink-0 mt-0.5" />
              <span>{pickLocalized(item, locale)}</span>
            </li>
          ))}
        </ul>
        {price.materialsExtra && (
          <p className="text-xs text-bm-muted mt-4 border-t border-bm-border/40 pt-3">
            {sl.materialsExtra}
          </p>
        )}
        <Link href="/cennik" className="inline-block mt-4 text-sm text-bm-red hover:underline">
          {sl.fullPriceList} →
        </Link>
      </Card>
    </section>
  );
}
