"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { createCallRequest } from "@/lib/booking-actions";
import { normalizePhone } from "@/lib/auth";

export function MiniQuoteWidget() {
  const { t } = useI18n();
  const mq = t.homeMiniQuote;
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
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
    if (result.ok) setDone(true);
    else setError(mq.error);
  };

  if (done) {
    return <p className="text-sm text-bm-red text-center py-4">{mq.done}</p>;
  }

  return (
    <div className="glass rounded-xl p-5 max-w-md mx-auto mt-8">
      <h3 className="font-display text-sm uppercase mb-3">{mq.title}</h3>
      <input
        className="input-field w-full mb-2"
        placeholder={mq.phone}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="input-field w-full mb-3 min-h-[80px]"
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
