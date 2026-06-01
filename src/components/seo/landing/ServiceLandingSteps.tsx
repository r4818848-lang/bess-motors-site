"use client";

import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingSteps } from "@/lib/service-landing-content";
import { pickLocalized } from "@/lib/service-landing-locale";
import { WaitTimeEstimator } from "@/components/booking/WaitTimeEstimator";

export function ServiceLandingSteps({
  serviceId,
  slug,
}: {
  serviceId: ServiceId;
  slug: string;
}) {
  const { t, locale } = useI18n();
  const steps = getServiceLandingSteps(serviceId, slug);

  return (
    <section className="mt-12" aria-labelledby="landing-steps-heading">
      <h2 id="landing-steps-heading" className="font-display text-xl uppercase mb-4">
        {t.seoHowItWorks.title}
      </h2>
      <div className="overflow-x-auto rounded-xl border border-bm-border/50">
        <table className="w-full text-sm text-left min-w-[520px]">
          <thead>
            <tr className="bg-bm-surface/80 text-xs uppercase tracking-wide">
              <th className="p-3 w-12 bg-bm-red/90 text-white font-bold">#</th>
              <th className="p-3 font-semibold">{t.serviceLanding.stepName}</th>
              <th className="p-3 font-semibold">{t.serviceLanding.stepDesc}</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, i) => (
              <tr
                key={step.title.pl}
                className={i % 2 === 0 ? "bg-bm-black/40" : "bg-bm-surface/30"}
              >
                <td className="p-3 font-bold text-bm-red align-top">{i + 1}</td>
                <td className="p-3 font-medium align-top">
                  {pickLocalized(step.title, locale)}
                </td>
                <td className="p-3 text-bm-muted align-top">
                  {pickLocalized(step.description, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <WaitTimeEstimator serviceId={serviceId} />
      </div>
    </section>
  );
}
