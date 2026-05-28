"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb } from "@/lib/store";
import { normalizePhone } from "@/lib/auth";

export function MiniQuoteWidget() {
  const { locale } = useI18n();
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    const p = normalizePhone(phone);
    if (!p || comment.length < 3) return;
    const db = loadDb();
    db.callRequests.push({
      id: `call-${Date.now()}`,
      phone: p,
      userId: "",
      serviceId: "diagnostic",
      serviceLabel: "Mini quote",
      clientName: "Mini quote",
      comment,
      status: "needs_call",
      source: "website",
      createdAt: new Date().toISOString(),
      marketing: { utmSource: "mini_quote", landingPage: "/" },
    });
    saveDb(db);
    setDone(true);
  };

  if (done) {
    return (
      <p className="text-sm text-bm-red text-center py-4">
        {locale === "ru" ? "Заявка отправлена — перезвоним." : "Zgłoszenie wysłane — oddzwonimy."}
      </p>
    );
  }

  return (
    <div className="glass rounded-xl p-5 max-w-md mx-auto mt-8">
      <h3 className="font-display text-sm uppercase mb-3">
        {locale === "ru" ? "Быстрая оценка" : "Szybka wycena"}
      </h3>
      <input
        className="input-field w-full mb-2"
        placeholder={locale === "ru" ? "Телефон" : "Telefon"}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="input-field w-full mb-3 min-h-[80px]"
        placeholder={locale === "ru" ? "Что беспокоит?" : "Co do naprawy?"}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="button" className="btn-primary w-full text-sm" onClick={submit}>
        {locale === "ru" ? "Отправить" : "Wyślij"}
      </button>
    </div>
  );
}
