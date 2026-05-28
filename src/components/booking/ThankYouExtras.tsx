"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CalendarPlus, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useI18n } from "@/lib/i18n/context";
import { loadLastBooking } from "@/lib/booking-url";
import { buildBookingIcs, downloadIcsFile } from "@/lib/ics-calendar";
import { siteConfig } from "@/lib/site";
import { getSiteUrl } from "@/lib/seo";

export function ThankYouExtras() {
  const { t } = useI18n();
  const e = t.thankYouExtras;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const booking = loadLastBooking();

  useEffect(() => {
    const url = `${getSiteUrl()}/cabinet`;
    QRCode.toDataURL(url, { width: 160, margin: 1, color: { dark: "#111111" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, []);

  const addToCalendar = () => {
    if (!booking?.date || !booking?.time) return;
    const ics = buildBookingIcs({
      title: "BESS MOTORS — wizyta serwisowa",
      description: booking.serviceLabels ?? "Rezerwacja online BESS MOTORS",
      location: siteConfig.address,
      date: booking.date,
      time: booking.time,
    });
    downloadIcsFile(ics);
  };

  return (
    <div className="mt-10 space-y-6">
      {booking?.date && booking?.time && (
        <button
          type="button"
          onClick={addToCalendar}
          className="w-full btn-outline inline-flex items-center justify-center gap-2"
        >
          <CalendarPlus size={18} />
          {e.addCalendar}
        </button>
      )}

      <div className="rounded-xl border border-bm-border/50 bg-bm-card/40 p-5">
        <div className="flex items-center gap-2 text-bm-red mb-3 justify-center">
          <QrCode size={18} />
          <span className="text-xs font-bold uppercase">{e.qrTitle}</span>
        </div>
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt="QR"
            width={160}
            height={160}
            unoptimized
            className="mx-auto rounded-lg bg-white p-2"
          />
        ) : (
          <div className="h-40 flex items-center justify-center text-bm-muted text-sm">
            …
          </div>
        )}
        <p className="text-xs text-bm-muted mt-3 text-center">{e.qrHint}</p>
      </div>
    </div>
  );
}
