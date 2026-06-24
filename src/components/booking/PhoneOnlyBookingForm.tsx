"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { createCallRequest } from "@/lib/booking-actions";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/session-context";
import { trackLead } from "@/lib/gtag";
import { saveSubmissionSnapshot, THANK_YOU_PATH } from "@/lib/submission-thank-you";
import { isPhoneContactValid, resolveBookingClientName } from "@/lib/booking-form-mode";
import { formatPln, type CartLine } from "@/lib/booking-cart";

const WORKSHOP_PHONE = "+48 791 257 229";

function withPhone(template: string): string {
  return template.replace("{phone}", WORKSHOP_PHONE);
}

type Props = {
  serviceId: string;
  serviceLabel: string;
  cartLines?: CartLine[];
  estimatedTotal?: number;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  trackSource?: string;
  onDone?: () => void;
  className?: string;
};

/** Service already chosen — client enters phone only; workshop calls to confirm time. */
export function PhoneOnlyBookingForm({
  serviceId,
  serviceLabel,
  cartLines = [],
  estimatedTotal,
  title,
  subtitle,
  submitLabel,
  trackSource = "phone_only_booking",
  onDone,
  className = "",
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const bq = t.bookingQuote;
  const q = t.bookingQuick;
  const { clientUser, sessionReady } = useAuth();
  const [clientPhone, setClientPhone] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    if (!sessionReady || !clientUser) return;
    setClientPhone(clientUser.phone);
  }, [sessionReady, clientUser]);

  const contactValid = isPhoneContactValid(clientPhone);
  const clientName = resolveBookingClientName(clientPhone, clientUser?.name);

  const submit = async () => {
    if (!contactValid || submitting || submitLock.current) return;
    const breakdown = cartLines
      .map((l) => `${l.label}: ${l.isFree ? bq.free : formatPln(l.lineTotal)}`)
      .join("; ");
    const comment = [
      q.phoneOnlyNote,
      cartLines.length ? `[${bq.grandTotal}: ${formatPln(estimatedTotal ?? 0)}]` : "",
      breakdown,
    ]
      .filter(Boolean)
      .join(" | ");

    setSubmitting(true);
    setSubmitError("");
    submitLock.current = true;
    try {
      const result = await createCallRequest({
        phone: clientPhone.trim(),
        clientName,
        serviceId,
        serviceLabel,
        comment,
        source: "phone_only_booking",
      });
      if (!result.ok) {
        setSubmitError(withPhone(bq.callFailed));
        return;
      }
      saveSubmissionSnapshot({
        kind: "booking",
        submittedAt: new Date().toISOString(),
        clientPhone: clientPhone.trim(),
        serviceLabels:
          cartLines.length > 0
            ? cartLines.map((l) => l.label).join(", ")
            : serviceLabel,
        cartLines: cartLines.map((l) => ({
          label: l.label,
          lineTotal: l.lineTotal,
          priceFrom: l.priceFrom,
          isFree: l.isFree,
        })),
        estimatedTotal,
      });
      trackLead("booking", { source: trackSource, serviceId, mode: "phone_only" });
      onDone?.();
      router.push(THANK_YOU_PATH);
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="text-center">
        <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-glow">
          {title ?? q.phoneOnlyTitle}
        </h2>
        <p className="text-sm text-bm-muted mt-2 max-w-md mx-auto">
          {subtitle ?? q.phoneOnlySubtitle}
        </p>
        <p className="mt-3 text-sm font-semibold text-bm-silver">{serviceLabel}</p>
        {cartLines.length > 0 && estimatedTotal != null ? (
          <p className="text-xs text-bm-muted mt-1">
            {bq.total}:{" "}
            <span className="font-mono font-bold text-bm-red">{formatPln(estimatedTotal)}</span>
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-[10px] uppercase text-bm-muted tracking-wide">{bq.yourPhone}</label>
        <input
          type="tel"
          className="input-premium w-full mt-1 text-lg"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          placeholder="+48 …"
          autoFocus
        />
        <p className="text-[10px] text-bm-muted mt-1">{q.phoneHint}</p>
      </div>

      {submitError ? <p className="text-sm text-red-400 text-center">{submitError}</p> : null}

      <Button
        className="w-full"
        data-fbq-track="Lead"
        disabled={!contactValid || submitting}
        onClick={submit}
      >
        {submitting ? bq.submitting : submitLabel ?? bq.submit}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
      <p className="text-[10px] text-center text-bm-muted">{bq.successHint}</p>
    </div>
  );
}
