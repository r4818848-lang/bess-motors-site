"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { createCallRequest } from "@/lib/booking-actions";
import { normalizePhone } from "@/lib/auth";
import { saveSubmissionSnapshot, THANK_YOU_PATH } from "@/lib/submission-thank-you";

export function MiniQuoteWidget() {
  const router = useRouter();
  const { t } = useI18n();
  const mq = t.homeMiniQuote;
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const p = normalizePhone(phone);
    if (!p || comment.length < 3 || sending) return;
    setSending(true);
    setError("");
    const result = await createCallRequest({
      phone: p,
      clientName: mq.title,
      serviceId: "diagnostic",
      serviceLabel: mq.title,
      comment,
      source: "mini_quote",
    });
    setSending(false);
    if (!result.ok) {
      setError(t.bookingQuote.callFailed.replace("{phone}", "+48 791 257 229"));
      return;
    }
    saveSubmissionSnapshot({
      kind: "call",
      submittedAt: new Date().toISOString(),
      clientPhone: p,
      serviceLabel: mq.title,
      comment,
    });
    router.push(THANK_YOU_PATH);
  };

  return (
    <div className="glass rounded-xl p-5 max-w-md mx-auto mt-8">
      <h3 className="font-display text-sm uppercase mb-3 text-white">{mq.title}</h3>
      <input
        className="w-full mb-2 rounded-lg border border-bm-border/60 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red"
        placeholder={mq.phone}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="w-full mb-3 min-h-[80px] rounded-lg border border-bm-border/60 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red resize-y"
        placeholder={mq.comment}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      <button
        type="button"
        className="btn-primary w-full text-sm"
        disabled={sending}
        onClick={submit}
      >
        {sending ? "…" : mq.submit}
      </button>
    </div>
  );
}
