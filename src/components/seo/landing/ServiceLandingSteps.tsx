"use client";

import { Calendar, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingSteps } from "@/lib/service-landing-content";
import { pickLocalized } from "@/lib/service-landing-locale";
import { WaitTimeEstimator } from "@/components/booking/WaitTimeEstimator";

export function ServiceLandingSteps({
  serviceId, slug, onBook,
}: {
  serviceId: ServiceId;
  slug: string;
  onBook?: () => void;
}) {
  const { t, locale } = useI18n();
  const steps = getServiceLandingSteps(serviceId, slug);
  const stepCountLabel = { pl: "kroków", ru: "этапов", uk: "етапів", en: "steps" }[locale];
  return (
    <section className="mt-14 scroll-mt-24" aria-labelledby="landing-steps-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff7772]">BESS MOTORS / SERWIS</p>
          <h2 id="landing-steps-heading" className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t.seoHowItWorks.title}
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/60"><CheckCircle2 size={17} className="text-[#ff7772]" aria-hidden />{steps.length} kroków</span>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="service-process-steps">
        {steps.map((step, i) => (
          <li key={step.title.pl} className="bm-premium-card relative flex min-h-[174px] flex-col rounded-[22px] border border-white/[0.12] bg-gradient-to-br from-[#20242c] to-[#151820] p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7772]">0{i + 1}</span>
              <CheckCircle2 size={18} className="text-white/30" aria-hidden />
            </div>
            <h3 className="mt-5 text-base font-bold leading-snug text-white">
              {pickLocalized(step.title, locale)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{pickLocalized(step.description, locale)}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <WaitTimeEstimator serviceId={serviceId} />
        {onBook ? (
          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-bm-red px-5 text-sm font-bold text-white hover:bg-red-700"
            data-fbq-track="InitiateCheckout"
            onClick={onBook}
          >
            <Calendar size={18} aria-hidden />
            {t.cabinet.bookVisit}
          </button>
        ) : null}
      </div>
    </section>
  );
}
