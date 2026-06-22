"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatDisplayDateKey, formatDisplayDateTime } from "@/lib/display-date";
import { formatPln } from "@/lib/booking-cart";
import type { SubmissionSnapshot } from "@/lib/submission-thank-you";

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 py-2.5 border-b border-bm-border/30 text-left">
      <dt className="text-xs uppercase tracking-wide text-bm-muted shrink-0">{label}</dt>
      <dd className="text-sm text-white sm:text-right sm:max-w-[65%] break-words">{value}</dd>
    </div>
  );
}

export function ThankYouSummary({ data }: { data: SubmissionSnapshot }) {
  const { t } = useI18n();
  const s = t.thankYou.summary;

  const servicesText = useMemo(() => {
    if (data.cartLines?.length) {
      return data.cartLines
        .map((line) => {
          const price = line.isFree
            ? t.bookingQuote.free
            : line.priceFrom
              ? `${t.bookingQuote.fromWarningShort} ${formatPln(line.lineTotal)}`
              : formatPln(line.lineTotal);
          return `${line.label} — ${price}`;
        })
        .join("\n");
    }
    return data.serviceLabels ?? data.serviceLabel ?? "";
  }, [data, t]);

  const kindLabel = data.kind === "booking" ? s.kindBooking : s.kindCall;

  return (
    <div className="mt-8 text-left rounded-2xl border border-bm-border/50 bg-bm-card/40 p-5 md:p-6">
      <h2 className="font-display text-sm uppercase text-bm-red mb-4">{s.title}</h2>
      <dl>
        <SummaryRow label={s.submittedAt} value={formatDisplayDateTime(data.submittedAt)} />
        <SummaryRow label={s.kind} value={kindLabel} />
        <SummaryRow label={s.firstName} value={data.clientFirstName ?? ""} />
        <SummaryRow label={s.lastName} value={data.clientLastName ?? ""} />
        <SummaryRow label={s.phone} value={data.clientPhone} />
        <SummaryRow label={s.email} value={data.clientEmail ?? ""} />
        <SummaryRow label={s.plate} value={data.clientPlate ?? ""} />
        {data.kind === "booking" && data.date ? (
          <SummaryRow
            label={s.date}
            value={
              data.time
                ? `${formatDisplayDateKey(data.date)} · ${data.time}`
                : formatDisplayDateKey(data.date)
            }
          />
        ) : null}
        <SummaryRow label={s.services} value={servicesText} />
        {data.estimatedTotal != null && data.estimatedTotal > 0 ? (
          <SummaryRow label={s.total} value={formatPln(data.estimatedTotal)} />
        ) : null}
        <SummaryRow label={s.comment} value={data.comment ?? ""} />
      </dl>
      {data.estimatedTotal != null && data.estimatedTotal > 0 ? (
        <p className="text-[10px] text-bm-muted mt-4 leading-relaxed">{s.totalHint}</p>
      ) : null}
    </div>
  );
}
