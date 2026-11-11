"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingAppointment } from "@/lib/booking-actions";
import { arrivalTimesForDate } from "@/lib/arrival-window";
import { BOOKING_HORIZON_DAYS } from "@/lib/booking-horizon";
import { formatWarsawDateKey } from "@/lib/date-key";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";
import { saveSubmissionSnapshot, THANK_YOU_PATH } from "@/lib/submission-thank-you";
import {
  TIRE_PUBLIC_RIM_SIZES,
  TIRE_QUICK_FORM_ID,
  TIRE_QUICK_SERVICES,
  buildTireQuickBooking,
  tireQuickAnswerPl,
  type TireQuickServiceId,
} from "@/lib/tire-quick-book";

type Props = {
  source: string;
};

function upcomingDateKeys(days: number): string[] {
  const keys: string[] = [];
  const start = Date.now();
  for (let i = 0; i < days + 1; i += 1) {
    const key = formatWarsawDateKey(new Date(start + i * 24 * 60 * 60 * 1000));
    if (!keys.includes(key)) keys.push(key);
  }
  return keys.slice(0, days);
}

export function TireQuickBookForm({ source }: Props) {
  const router = useRouter();
  const { isSlotAvailable, loading, loaded } = useBookingAvailability();
  const [serviceId, setServiceId] = useState<TireQuickServiceId>("change");
  const [rim, setRim] = useState<string>("R16");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  const dates = useMemo(() => upcomingDateKeys(BOOKING_HORIZON_DAYS), []);
  const openDates = dates.filter((day) => arrivalTimesForDate(day).some((slot) => isSlotAvailable(day, slot)));
  const times = date ? arrivalTimesForDate(date).filter((slot) => isSlotAvailable(date, slot)) : [];

  const submit = async () => {
    if (submitting || lock.current) return;
    const built = buildTireQuickBooking({ serviceId, rim, date, time, phone });
    if (!built.ok) {
      setError("Uzupełnij usługę, rozmiar R, datę, godzinę i telefon.");
      return;
    }
    if (!loaded || !isSlotAvailable(built.booking.date, built.booking.time)) {
      setError("Ten termin nie jest wolny. Wybierz inną godzinę.");
      return;
    }
    lock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const result = await createBookingAppointment({
        ...built.booking,
        serviceId: "tires",
      });
      if (!result.ok) {
        setError(result.error === "slot_taken" ? "Ten termin został właśnie zajęty." : "Nie udało się zapisać wizyty. Zadzwoń do warsztatu.");
        return;
      }
      const label = TIRE_QUICK_SERVICES.find((item) => item.id === serviceId)?.labelPl ?? "Opony";
      saveSubmissionSnapshot({
        kind: "booking",
        submittedAt: new Date().toISOString(),
        clientPhone: built.booking.clientPhone,
        date: built.booking.date,
        time: built.booking.time,
        serviceLabel: `${label}, ${rim}`,
        comment: source,
      });
      router.push(THANK_YOU_PATH);
    } finally {
      setSubmitting(false);
      lock.current = false;
    }
  };

  return (
    <section id={TIRE_QUICK_FORM_ID} className="mt-8 scroll-mt-28 rounded-2xl border border-bm-red/40 bg-bm-card/60 p-4 sm:p-6 text-left">
      <h2 className="font-display text-xl uppercase text-white">Umów wizytę</h2>
      <p className="mt-2 text-sm text-bm-muted leading-relaxed">{tireQuickAnswerPl()}</p>
      <p className="mt-2 text-xs text-bm-muted">Telefon zostaje w zapisie warsztatu. Analityka nie dostaje numeru, imienia ani treści komentarza.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-bm-muted">Usługa</span>
          <select className="input-premium mt-1" value={serviceId} onChange={(event) => setServiceId(event.target.value as TireQuickServiceId)}>
            {TIRE_QUICK_SERVICES.map((item) => (
              <option key={item.id} value={item.id}>{item.labelPl}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-bm-muted">Rozmiar R</span>
          <select className="input-premium mt-1" value={rim} onChange={(event) => setRim(event.target.value)}>
            {TIRE_PUBLIC_RIM_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-bm-muted">Data</span>
          <select
            className="input-premium mt-1"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setTime("");
            }}
          >
            <option value="">{loading ? "Sprawdzam terminy…" : "Wybierz dzień"}</option>
            {openDates.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-bm-muted">Godzina</span>
          <select className="input-premium mt-1" value={time} onChange={(event) => setTime(event.target.value)}>
            <option value="">Wybierz godzinę</option>
            {times.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-bm-muted">Telefon</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="input-premium mt-1 text-base"
            placeholder="+48 …"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
      </div>
      {loaded && openDates.length === 0 ? (
        <p className="mt-3 text-sm text-amber-200">Kalendarz nie pokazał wolnego terminu. Zadzwoń, a dobierzemy godzinę.</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <button type="button" className="btn-primary mt-4 w-full min-h-12" disabled={submitting} onClick={submit}>
        {submitting ? "Zapisuję…" : "Umów wizytę"}
      </button>
    </section>
  );
}
