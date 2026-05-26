"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import {
  trackMetaCompleteRegistration,
  trackMetaSchedule,
} from "@/lib/meta-pixel";

export default function BookingThankYouPage() {
  const { t } = useI18n();
  const ty = t.thankYou;

  useEffect(() => {
    trackMetaSchedule("booking_thank_you");
    trackMetaCompleteRegistration("booking_thank_you");
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "booking_submit",
        event_category: "booking",
        event_label: "thank_you_page",
      });
    }
  }, []);

  return (
    <div className="pt-28 pb-24 min-h-[70vh] flex items-center">
      <div className="mx-auto max-w-lg px-4 text-center">
        <Check className="w-20 h-20 text-bm-red mx-auto mb-6" />
        <h1 className="font-display text-3xl font-bold uppercase text-glow">{ty.title}</h1>
        <p className="text-bm-muted mt-4 leading-relaxed">{ty.message}</p>
        <p className="text-sm text-bm-silver mt-6">{ty.hours}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <PhoneLink trackSource="thank_you" className="btn-primary inline-flex justify-center">
            <Phone size={18} /> {ty.call}
          </PhoneLink>
          <Link href="/cabinet" className="btn-outline inline-flex justify-center">
            {ty.cabinet}
          </Link>
        </div>
        <Link href="/" className="block mt-8 text-sm text-bm-muted hover:text-bm-red">
          ← {ty.home}
        </Link>
      </div>
    </div>
  );
}
