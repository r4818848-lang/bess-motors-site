"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { trackBookingRequestSubmitSuccess, trackCallbackSubmitSuccess } from "@/lib/gtag";
import { trackGoogleAdsBookingConversion } from "@/lib/google-ads";
import { trackMetaLead, trackMetaSchedule } from "@/lib/meta-pixel";
import { claimConversionSlot, conversionDedupeKey, planThankYouConversions } from "@/lib/conversion-count";
import { ThankYouExtras } from "@/components/booking/ThankYouExtras";
import { ThankYouSummary } from "@/components/booking/ThankYouSummary";
import { PwaInstallHint } from "@/components/pwa/PwaInstallHint";
import {
  loadSubmissionSnapshot,
  type SubmissionSnapshot,
} from "@/lib/submission-thank-you";

function ThankYouContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const ty = t.thankYou;
  const syncPending = searchParams.get("sync") === "pending";
  const [snapshot, setSnapshot] = useState<SubmissionSnapshot | null>(null);

  useEffect(() => {
    const saved = loadSubmissionSnapshot();
    setSnapshot(saved);
    const firstTime = saved
      ? claimConversionSlot(conversionDedupeKey(saved.kind, saved.submittedAt), sessionStorage)
      : false;
    for (const event of planThankYouConversions(saved, firstTime)) {
      if (event === "booking_request_submit_success") trackBookingRequestSubmitSuccess("thank_you_page");
      if (event === "google_ads_booking") trackGoogleAdsBookingConversion({ event_label: "thank_you_page" });
      if (event === "meta_schedule") trackMetaSchedule("thank_you_page");
      if (event === "callback_submit_success") trackCallbackSubmitSuccess("thank_you_page");
      if (event === "meta_lead") trackMetaLead("thank_you_page");
    }
  }, []);

  const title =
    snapshot?.kind === "call"
      ? t.services.callback.done
      : ty.title;

  return (
    <div className="pt-28 pb-24 min-h-[70vh]">
      <div className="mx-auto max-w-lg px-4 text-center">
        <Check className="bm-confirm w-20 h-20 text-bm-red mx-auto mb-6" />
        <h1 className="font-display text-3xl font-bold uppercase text-glow">{title}</h1>
        <PwaInstallHint />
        <p className="text-bm-muted mt-4 leading-relaxed">
          {syncPending ? ty.syncPending : ty.message}
        </p>

        {snapshot ? (
          <ThankYouSummary data={snapshot} />
        ) : (
          <p className="text-sm text-bm-muted mt-8 glass rounded-xl p-4">{ty.noSummary}</p>
        )}

        <p className="text-sm text-bm-silver mt-6">{ty.hours}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <PhoneLink trackSource="thank_you" className="btn-primary inline-flex justify-center">
            <Phone size={18} /> {ty.call}
          </PhoneLink>
          <Link href="/contacts" className="btn-outline inline-flex justify-center">
            {t.nav.contacts}
          </Link>
        </div>
        <ThankYouExtras snapshot={snapshot} />

        <Link href="/" className="block mt-8 text-sm text-bm-muted hover:text-bm-red">
          ← {ty.home}
        </Link>
      </div>
    </div>
  );
}

export default function BookingThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 pb-24 min-h-[70vh] flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-bm-red border-t-transparent animate-spin" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
