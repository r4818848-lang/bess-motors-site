"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { formatDateKey } from "@/lib/appointments";
import { createBookingAppointment } from "@/lib/booking-actions";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { Button } from "@/components/ui/Button";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";
import { useAuth } from "@/lib/auth/session-context";
import { trackLead } from "@/lib/gtag";
import { saveSubmissionSnapshot, THANK_YOU_PATH } from "@/lib/submission-thank-you";
import {
  isPhoneContactValid,
  pickFirstAvailableSlot,
  resolveBookingClientName,
} from "@/lib/booking-form-mode";
import type { ServiceId } from "@/lib/services-catalog";
import { itemLabel, serviceBasePriceId } from "@/lib/service-price-map";
import { getPriceItem } from "@/lib/price-list";
import { buildCartLine, cartSubtotal, formatPln, defaultQuantity } from "@/lib/booking-cart";

const WORKSHOP_PHONE = "+48 791 257 229";

function withPhone(template: string): string {
  return template.replace("{phone}", WORKSHOP_PHONE);
}

type Props = {
  serviceId: ServiceId;
  onDone?: () => void;
  trackSource?: string;
  className?: string;
};

/** Minimal AC booking: date + phone only (workshop assigns time). */
export function AcQuickBookingForm({
  serviceId,
  onDone,
  trackSource = "ac_quick_booking",
  className = "",
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const bq = t.bookingQuote;
  const q = t.bookingQuick;
  const { clientUser, sessionReady } = useAuth();
  const [date, setDate] = useState<Date | null>(null);
  const [clientPhone, setClientPhone] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const { isSlotAvailable, loading: slotsLoading, availabilityError } = useBookingAvailability();

  const serviceLabel =
    t.serviceItems[serviceId as keyof typeof t.serviceItems] ?? serviceId;
  const basePriceId = serviceBasePriceId[serviceId] ?? "ac_r134a";
  const baseItem = getPriceItem(basePriceId);
  const cartLine = baseItem
    ? buildCartLine(baseItem, itemLabel(baseItem, locale), defaultQuantity(baseItem))
    : null;
  const estimatedTotal = cartLine ? cartSubtotal([cartLine]) : undefined;

  useEffect(() => {
    if (!sessionReady || !clientUser) return;
    setClientPhone(clientUser.phone);
  }, [sessionReady, clientUser]);

  const onSelectDate = useCallback((d: Date | null) => {
    setDate(d);
    setSubmitError("");
  }, []);

  const contactValid = isPhoneContactValid(clientPhone);
  const clientName = resolveBookingClientName(
    clientPhone,
    clientUser?.name
  );

  const submit = async () => {
    if (!contactValid || !date || submitting || submitLock.current) return;
    const dateStr = formatDateKey(date);
    if (availabilityError) {
      setSubmitError(bq.availabilityError);
      return;
    }
    if (slotsLoading) {
      setSubmitError(bq.slotsLoading);
      return;
    }
    const time = pickFirstAvailableSlot(dateStr, isSlotAvailable);
    if (!time) {
      setSubmitError(q.noSlotsOnDate);
      return;
    }

    const comment = [
      cartLine ? `[${bq.grandTotal}: ${formatPln(estimatedTotal ?? 0)}]` : "",
      cartLine ? `${cartLine.label}: ${formatPln(cartLine.lineTotal)}` : "",
      q.flexibleTimeNote,
    ]
      .filter(Boolean)
      .join(" | ");

    setSubmitting(true);
    setSubmitError("");
    submitLock.current = true;
    try {
      const result = await createBookingAppointment({
        serviceId,
        serviceIds: [basePriceId],
        date: dateStr,
        time,
        comment,
        clientName,
        clientPhone: clientPhone.trim(),
        clientPlate: "",
        estimatedTotal,
        cartLines: cartLine
          ? [
              {
                itemId: cartLine.itemId,
                label: cartLine.label,
                lineTotal: cartLine.lineTotal,
                priceFrom: cartLine.priceFrom,
              },
            ]
          : undefined,
      });
      if (!result.ok) {
        setSubmitError(
          result.error === "slot_taken"
            ? bq.slotTaken
            : withPhone(bq.cloudSyncFailed)
        );
        return;
      }
      saveSubmissionSnapshot({
        kind: "booking",
        submittedAt: new Date().toISOString(),
        clientPhone: clientPhone.trim(),
        date: dateStr,
        time,
        serviceLabels: serviceLabel,
        cartLines: cartLine
          ? [
              {
                label: cartLine.label,
                lineTotal: cartLine.lineTotal,
                priceFrom: cartLine.priceFrom,
                isFree: cartLine.isFree,
              },
            ]
          : undefined,
        estimatedTotal,
      });
      trackLead("booking", { source: trackSource, serviceId });
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
        <p className="text-xs uppercase text-bm-red tracking-widest font-bold">{t.seasonalAc.badge}</p>
        <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-glow mt-2">
          {q.acTitle}
        </h2>
        <p className="text-sm text-bm-muted mt-2 max-w-md mx-auto">{q.acSubtitle}</p>
      </div>

      <div>
        <p className="text-[10px] uppercase text-bm-muted tracking-wide mb-2 text-center">
          {t.booking.selectDate}
        </p>
        <BookingCalendar selected={date} onSelect={onSelectDate} locale={locale} />
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
        />
        <p className="text-[10px] text-bm-muted mt-1">{q.phoneHint}</p>
      </div>

      {estimatedTotal != null && cartLine ? (
        <p className="text-center text-sm text-bm-silver">
          {bq.total}:{" "}
          <span className="font-mono font-bold text-bm-red">{formatPln(estimatedTotal)}</span>
          <span className="block text-[10px] text-bm-muted mt-1">{q.priceFromNote}</span>
        </p>
      ) : null}

      {submitError ? (
        <p className="text-sm text-red-400 text-center">{submitError}</p>
      ) : null}

      <Button
        className="w-full"
        data-fbq-track="Lead"
        disabled={!contactValid || !date || submitting || slotsLoading}
        onClick={submit}
      >
        {submitting ? bq.submitting : q.submitAc}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
