"use client";

import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { WaitTimeEstimator } from "@/components/booking/WaitTimeEstimator";
import { Card } from "@/components/ui/Card";

export function SeoHowItWorks({ serviceId }: { serviceId?: ServiceId }) {
  const { t } = useI18n();
  const h = t.seoHowItWorks;

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl uppercase mb-4">{h.title}</h2>
      <ol className="grid sm:grid-cols-2 gap-3 mb-6">
        {h.steps.map((s, i) => (
          <Card key={s} className="p-4 flex gap-3">
            <span className="text-bm-red font-bold">{i + 1}</span>
            <span className="text-sm">{s}</span>
          </Card>
        ))}
      </ol>
      <WaitTimeEstimator serviceId={serviceId} />
    </section>
  );
}
