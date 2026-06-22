"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { useI18n } from "@/lib/i18n/context";
import { popularServices, type ServiceId } from "@/lib/services-catalog";
import { serviceLandingHref } from "@/lib/service-slug-map";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LazySmartBookingModal } from "@/components/booking/LazySmartBookingModal";
import { useMetaViewContent } from "@/hooks/useMetaViewContent";
import { CallbackRequestCta } from "@/components/callback/CallbackRequestCta";
import { createCallRequest } from "@/lib/booking-actions";
import { normalizePhone } from "@/lib/auth";
import { saveSubmissionSnapshot, THANK_YOU_PATH } from "@/lib/submission-thank-you";

export default function ServicesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const s = t.services;
  useMetaViewContent("Services Page");
  const [problem, setProblem] = useState("");
  const [phone, setPhone] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [sending, setSending] = useState(false);
  const [bookingService, setBookingService] = useState<ServiceId | null>(null);

  const submitCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!p || sending) return;
    setSending(true);
    setSubmitError("");
    const result = await createCallRequest({
      phone: p,
      clientName: s.customRequest,
      serviceId: "otherReason",
      serviceLabel: s.customRequest,
      comment: problem.trim() || s.callback.commentDefault,
      source: "services_custom_request",
    });
    setSending(false);
    if (!result.ok) {
      setSubmitError(s.requestError);
      return;
    }
    saveSubmissionSnapshot({
      kind: "call",
      submittedAt: new Date().toISOString(),
      clientPhone: p,
      serviceLabel: s.customRequest,
      comment: problem.trim() || s.callback.commentDefault,
    });
    router.push(THANK_YOU_PATH);
  };

  return (
    <>
      <div className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase text-glow">
              {s.title}
            </h1>
            <p className="mt-4 text-bm-muted text-lg max-w-2xl">{s.subtitle}</p>
            <div className="mt-4 h-1 w-24 bg-bm-red shadow-neon-sm" />
            <Link
              href="/cennik"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-bm-red/50 bg-bm-red/10 px-5 py-3 text-sm font-bold uppercase tracking-wide text-bm-red hover:bg-bm-red/20 transition-colors"
            >
              {s.viewPriceList} →
            </Link>
          </motion.div>

          <div className="mt-12 max-w-3xl">
            <CallbackRequestCta
              labels={s.callback}
              source="services_callback"
              serviceId="otherReason"
              serviceLabel={s.callback.title}
            />
          </div>

          <section className="mt-16">
            <h2 className="font-display text-xl uppercase tracking-wide mb-8 text-bm-red">
              {t.sections.popularServices}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {popularServices.map((cat, i) => {
                const label = t.serviceItems[cat.id as keyof typeof t.serviceItems];
                const detailHref = serviceLandingHref(cat.id as ServiceId);
                return (
                  <Card
                    key={cat.id}
                    delay={Math.min(i * 0.02, 0.3)}
                    glow
                    className="cursor-pointer group flex flex-col"
                    onClick={() => setBookingService(cat.id)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl metallic text-bm-red mb-3 group-hover:shadow-neon transition-shadow">
                      <ServiceIcon name={cat.icon} size={22} />
                    </div>
                    <h3 className="font-display font-semibold uppercase text-xs">{label}</h3>
                    {detailHref && (
                      <Link
                        href={detailHref}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 btn-primary text-[10px] uppercase tracking-wide inline-flex items-center justify-center px-3 py-2"
                      >
                        {t.bookingFlow.viewServicePage}
                      </Link>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mt-20">
            <Card glow className="max-w-2xl mx-auto">
              <h2 className="font-display text-xl uppercase text-bm-red mb-6">
                {s.customRequest}
              </h2>
              <form onSubmit={submitCustomRequest} className="space-y-4">
                  <input
                    type="tel"
                    className="input-premium"
                    placeholder={s.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                  <textarea
                    className="input-premium min-h-[120px] resize-y"
                    placeholder={s.describeProblem}
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? "…" : s.submit}
                  </Button>
                  {submitError ? (
                    <p className="text-xs text-red-400 text-center">{submitError}</p>
                  ) : null}
                </form>
            </Card>
          </section>
        </div>
      </div>
      {bookingService && (
        <LazySmartBookingModal
          serviceId={bookingService}
          onClose={() => setBookingService(null)}
        />
      )}
    </>
  );
}
