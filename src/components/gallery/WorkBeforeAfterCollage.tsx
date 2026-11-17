"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Camera, ChevronDown, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { documentLocale } from "@/lib/i18n/locale-utils";
import type { WorkBeforeAfterCase } from "@/lib/work-before-after";

function Photo({
  src, alt, badge, onOpen, large = false,
}: {
  src: string; alt: string; badge?: string; onOpen: () => void; large?: boolean;
}) {
  return (
    <button
      type="button"
      className={"group relative block w-full overflow-hidden bg-[#0c0f13] text-left " + (large ? "aspect-[4/3]" : "aspect-square")}
      onClick={onOpen}
      aria-label={alt}
    >
      <Image src={src} alt={alt} fill unoptimized sizes={large ? "(max-width: 768px) 50vw, 450px" : "(max-width: 768px) 33vw, 160px"} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
      {badge ? <span className="absolute left-3 top-3 rounded-md border border-white/25 bg-black/75 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">{badge}</span> : null}
      <span className="absolute bottom-3 right-3 rounded-full bg-black/65 p-2 text-bm-copy opacity-80 transition-opacity group-hover:opacity-100" aria-hidden><ArrowUpRight size={16} /></span>
    </button>
  );
}

export function WorkBeforeAfterCollage({ item }: { item: WorkBeforeAfterCase }) {
  const { t, locale } = useI18n();
  const lang = documentLocale(locale);
  const w = t.workCases;
  const [open, setOpen] = useState<{ src: string; alt: string } | null>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(null); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  const jobName = item.job[lang];
  const hasComparison = item.before.length > 0 && item.after.length > 0;
  const extraBefore = item.before.slice(1);
  const extraAfter = item.after.slice(1);
  const extraCount = extraBefore.length + extraAfter.length;
  const openPhoto = (src: string, alt: string) => setOpen({ src, alt });

  return (
    <article className="overflow-hidden rounded-[24px] border border-white/15 bg-[#1a1e26]" data-testid="repair-portfolio-case">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          {item.make ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-bm-accent">{item.make}</p> : null}
          <h3 className="text-lg font-bold tracking-tight text-white">{jobName}</h3>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-bm-label"><Camera size={16} aria-hidden />{item.before.length + item.after.length + (item.workPhotos?.length ?? 0)}</span>
      </div>

      {hasComparison ? (
        <>
          <div className="grid grid-cols-2 gap-1 bg-[#0e1116]" data-testid="before-after-comparison">
            <Photo src={item.before[0]} alt={jobName + " — " + w.before} badge={w.before} large onOpen={() => openPhoto(item.before[0], jobName + " — " + w.before)} />
            <Photo src={item.after[0]} alt={jobName + " — " + w.after} badge={w.after} large onOpen={() => openPhoto(item.after[0], jobName + " — " + w.after)} />
          </div>
          {extraCount > 0 ? (
            <details className="group border-t border-white/10">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-bold text-white/85 transition-colors hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden">
                <span>{w.sectionTitle} · {extraCount}</span>
                <ChevronDown size={18} className="text-bm-accent transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="grid grid-cols-3 gap-1 border-t border-white/10 bg-[#0e1116] sm:grid-cols-5">
                {extraBefore.map((src, idx) => <Photo key={src} src={src} alt={jobName + " — " + w.before + " " + (idx + 2)} onOpen={() => openPhoto(src, jobName + " — " + w.before)} />)}
                {extraAfter.map((src, idx) => <Photo key={src} src={src} alt={jobName + " — " + w.after + " " + (idx + 2)} onOpen={() => openPhoto(src, jobName + " — " + w.after)} />)}
              </div>
            </details>
          ) : null}
        </>
      ) : item.workPhotos?.length ? (
        <div className="grid grid-cols-2 gap-1 bg-[#0e1116] sm:grid-cols-3">
          {item.workPhotos.map((src, idx) => <Photo key={src} src={src} alt={jobName + " — " + w.work + " " + (idx + 1)} large onOpen={() => openPhoto(src, jobName)} />)}
        </div>
      ) : null}

      {open ? (
        <div role="dialog" aria-modal="true" aria-label={jobName} className="fixed inset-0 z-[130] flex items-center justify-center bg-black/95 p-4">
          <button type="button" onClick={() => setOpen(null)} className="absolute inset-0" aria-label={w.close} />
          <button type="button" onClick={() => setOpen(null)} className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white" aria-label={w.close}><X size={24} /></button>
          <div className="pointer-events-none relative h-[82dvh] w-full max-w-6xl">
            <Image src={open.src} alt={open.alt} fill unoptimized sizes="100vw" className="object-contain" />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function WorkBeforeAfterList({
  cases, heading, hint,
}: {
  cases: WorkBeforeAfterCase[];
  heading?: string;
  hint?: string;
}) {
  const { t } = useI18n();
  const w = t.workCases;
  if (!cases.length) return null;
  return (
    <div className="space-y-6">
      {heading !== "" ? (
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{heading ?? w.sectionTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bm-label">{hint ?? w.sectionHint}</p>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        {cases.map((item) => <WorkBeforeAfterCollage key={item.id} item={item} />)}
      </div>
    </div>
  );
}
