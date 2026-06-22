"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { createCallRequest } from "@/lib/booking-actions";
import { normalizePhone } from "@/lib/auth";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { siteConfig } from "@/lib/site";

export type CallbackRequestLabels = {
  title: string;
  subtitle: string;
  phonePlaceholder: string;
  submit: string;
  done: string;
  error: string;
  commentDefault: string;
};

type Props = {
  labels: CallbackRequestLabels;
  source: string;
  serviceId?: string;
  serviceLabel?: string;
  className?: string;
};

export function CallbackRequestCta({
  labels,
  source,
  serviceId = "otherReason",
  serviceLabel,
  className = "",
}: Props) {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const p = normalizePhone(phone);
    if (!p || sending) return;
    setSending(true);
    setError("");
    const result = await createCallRequest({
      phone: p,
      clientName: labels.title,
      serviceId,
      serviceLabel: serviceLabel ?? labels.title,
      comment: labels.commentDefault,
      source,
    });
    setSending(false);
    if (result.ok) setDone(true);
    else setError(labels.error);
  };

  return (
    <div
      className={`rounded-2xl border border-bm-red/30 bg-gradient-to-br from-bm-card/80 to-bm-black p-5 md:p-6 ${className}`}
    >
      <h2 className="font-display text-lg uppercase text-glow mb-2">{labels.title}</h2>
      <p className="text-sm text-bm-muted mb-4">{labels.subtitle}</p>
      <PhoneLink className="inline-flex items-center gap-2 text-xl font-display font-bold text-bm-red hover:underline mb-4">
        <Phone size={20} />
        {siteConfig.phone}
      </PhoneLink>
      {done ? (
        <p className="text-sm text-bm-red">{labels.done}</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <input
            type="tel"
            className="input-premium flex-1"
            placeholder={labels.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <button
            type="button"
            className="btn-primary shrink-0 text-sm"
            disabled={sending}
            onClick={submit}
          >
            {sending ? "…" : labels.submit}
          </button>
        </div>
      )}
      {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
    </div>
  );

}
