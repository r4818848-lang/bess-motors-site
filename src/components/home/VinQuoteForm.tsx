"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { FileSearch, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { createCallRequest } from "@/lib/booking-actions";
import { normalizePhone } from "@/lib/auth";
import { fireFbq } from "@/lib/meta-pixel";
import { trackLead } from "@/lib/gtag";
import { siteConfig } from "@/lib/site";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { workshopWhatsAppChatUrl } from "@/lib/chat-cta";

/**
 * Lead form: wycena po VIN.
 * Photos are not uploaded to the server (no blob store) —
 * after success we offer WhatsApp for photos.
 */
export function VinQuoteForm() {
  const { t, locale } = useI18n();
  const v = t.vinQuote;
  const [phone, setPhone] = useState("");
  const [vin, setVin] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [problem, setProblem] = useState("");
  const [mileage, setMileage] = useState("");
  const [preferred, setPreferred] = useState<"phone" | "whatsapp">("phone");
  const [photoCount, setPhotoCount] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (p.length < 9) {
      setError(v.errorPhone);
      return;
    }
    if (sending) return;
    setSending(true);
    setError("");

    const vehicle = [brand.trim(), model.trim(), year.trim()].filter(Boolean).join(" ");
    const parts = [
      "Wyceń po VIN",
      vin.trim() ? `VIN: ${vin.trim().toUpperCase()}` : null,
      vehicle ? `Pojazd: ${vehicle}` : null,
      mileage.trim() ? `Przebieg: ${mileage.trim()}` : null,
      `Kontakt: ${preferred === "whatsapp" ? "WhatsApp" : "Telefon"}`,
      photoCount > 0 ? `Zdjęcia: klient ma ${photoCount} plik(ów) — prosi o WhatsApp` : null,
      problem.trim() ? `Opis: ${problem.trim()}` : null,
    ].filter(Boolean);

    const result = await createCallRequest({
      phone: p,
      clientName: vehicle || "Klient",
      serviceId: "diagnostic",
      serviceLabel: "Wyceń po VIN",
      comment: parts.join("\n"),
      source: "vin_quote",
    });
    setSending(false);
    if (!result.ok) {
      setError(v.error);
      return;
    }

    trackLead("call_request", { lead_source: "vin_quote" });
    fireFbq("Lead", { content_name: "vin_quote" });
    setDone(true);
  };

  if (done) {
    return (
      <section
        id="wyceń-po-vin"
        className="py-12 sm:py-16 border-t border-bm-border/40 scroll-mt-24"
        aria-labelledby="vin-quote-heading"
      >
        <div className="mx-auto max-w-2xl px-4 lg:px-8 text-center">
          <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={40} />
          <h2 id="vin-quote-heading" className="font-display text-2xl font-bold uppercase text-white">
            {v.successTitle}
          </h2>
          <p className="mt-3 text-bm-silver/90">{v.successBody}</p>
          <SocialContactLink
            kind="whatsapp"
            href={workshopWhatsAppChatUrl(locale)}
            trackSource="vin_quote_photos_wa"
            className="btn-primary mt-6 inline-flex min-h-[44px]"
          >
            {v.photosWhatsapp}
          </SocialContactLink>
        </div>
      </section>
    );
  }

  return (
    <section
      id="wyceń-po-vin"
      className="py-12 sm:py-16 border-t border-bm-border/40 bg-bm-graphite/40 scroll-mt-24"
      aria-labelledby="vin-quote-heading"
    >
      <div className="mx-auto max-w-2xl px-4 lg:px-8">
        <div className="flex items-center gap-2 text-bm-red mb-3">
          <FileSearch size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">{v.badge}</p>
        </div>
        <h2
          id="vin-quote-heading"
          className="font-display text-2xl sm:text-3xl font-bold uppercase text-white"
        >
          {v.title}
        </h2>
        <p className="mt-2 text-sm text-bm-muted">{v.subtitle}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="vin-phone" className="block text-xs font-semibold text-bm-silver mb-1.5">
              {v.phone} *
            </label>
            <input
              id="vin-phone"
              type="tel"
              required
              autoComplete="tel"
              className="w-full rounded-lg border border-bm-border/60 bg-white px-4 py-3 min-h-[44px] text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red"
              placeholder={v.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="vin-code" className="block text-xs font-semibold text-bm-silver mb-1.5">
              {v.vin}
            </label>
            <input
              id="vin-code"
              className="w-full rounded-lg border border-bm-border/60 bg-white px-4 py-3 min-h-[44px] text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red uppercase tracking-wider"
              placeholder={v.vinPlaceholder}
              value={vin}
              maxLength={17}
              onChange={(e) => setVin(e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="vin-brand" className="block text-xs font-semibold text-bm-silver mb-1.5">
                {v.brand}
              </label>
              <input
                id="vin-brand"
                className="w-full rounded-lg border border-bm-border/60 bg-white px-4 py-3 min-h-[44px] text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red"
                placeholder={v.brandPlaceholder}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vin-model" className="block text-xs font-semibold text-bm-silver mb-1.5">
                {v.model}
              </label>
              <input
                id="vin-model"
                className="w-full rounded-lg border border-bm-border/60 bg-white px-4 py-3 min-h-[44px] text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red"
                placeholder={v.modelPlaceholder}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vin-year" className="block text-xs font-semibold text-bm-silver mb-1.5">
                {v.year}
              </label>
              <input
                id="vin-year"
                inputMode="numeric"
                className="w-full rounded-lg border border-bm-border/60 bg-white px-4 py-3 min-h-[44px] text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red"
                placeholder={v.yearPlaceholder}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="vin-mileage" className="block text-xs font-semibold text-bm-silver mb-1.5">
              {v.mileage}
            </label>
            <input
              id="vin-mileage"
              className="w-full rounded-lg border border-bm-border/60 bg-white px-4 py-3 min-h-[44px] text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red"
              placeholder={v.mileagePlaceholder}
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="vin-problem" className="block text-xs font-semibold text-bm-silver mb-1.5">
              {v.problem}
            </label>
            <textarea
              id="vin-problem"
              className="w-full min-h-[100px] rounded-lg border border-bm-border/60 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-bm-red resize-y"
              placeholder={v.problemPlaceholder}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="vin-photos" className="block text-xs font-semibold text-bm-silver mb-1.5">
              {v.photos}
            </label>
            <input
              id="vin-photos"
              type="file"
              accept="image/*"
              multiple
              className="w-full text-sm text-bm-muted file:mr-3 file:rounded file:border-0 file:bg-bm-red file:px-3 file:py-2 file:text-white file:text-xs file:font-bold"
              onChange={(e) => setPhotoCount(e.target.files?.length ?? 0)}
            />
            <p className="mt-1 text-xs text-bm-muted">{v.photosHint}</p>
          </div>

          <fieldset>
            <legend className="text-xs font-semibold text-bm-silver mb-2">{v.preferredContact}</legend>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-white min-h-[44px]">
                <input
                  type="radio"
                  name="preferred"
                  checked={preferred === "phone"}
                  onChange={() => setPreferred("phone")}
                />
                {v.contactPhone}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-white min-h-[44px]">
                <input
                  type="radio"
                  name="preferred"
                  checked={preferred === "whatsapp"}
                  onChange={() => setPreferred("whatsapp")}
                />
                {v.contactWhatsapp}
              </label>
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="btn-primary w-full sm:w-auto min-h-[44px] px-8 uppercase tracking-wide"
          >
            {sending ? "…" : v.submit}
          </button>

          <p className="text-xs text-bm-muted">
            {v.privacyNote}{" "}
            <Link href="/privacy" className="underline hover:text-white">
              {t.common.privacy}
            </Link>
            {" · "}
            <a href={siteConfig.phoneHref} className="underline hover:text-white">
              {siteConfig.phone}
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
