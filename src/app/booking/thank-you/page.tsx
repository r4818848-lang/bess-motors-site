"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { trackLead } from "@/lib/gtag";
import { trackGoogleAdsBookingConversion } from "@/lib/google-ads";
import { trackMetaLead, trackMetaSchedule } from "@/lib/meta-pixel";
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
    setSnapshot(loadSubmissionSnapshot());
    trackLead("booking", { source: "thank_you_page" });
    trackGoogleAdsBookingConversion({ event_label: "thank_you_page" });
    trackMetaLead("thank_you_page");
    trackMetaSchedule("thank_you_page");
  }, []);

  const title =
    snapshot?.kind === "call"
      ? t.services.callback.done
      : ty.title;

  return (
    <div className="pt-28 pb-24 min-h-[70vh]">
      <div className="mx-auto max-w-lg px-4 text-center">
        <Check className="w-20 h-20 text-bm-red mx-auto mb-6" />
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
          <Link href="/cabinet" className="btn-outline inline-flex justify-center">
            {ty.cabinet}
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
