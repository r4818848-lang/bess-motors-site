"use client";

import { useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { documentLocale } from "@/lib/i18n/locale-utils";
import {
  formatWorkCaseCaption,
  type WorkBeforeAfterCase,
} from "@/lib/work-before-after";

function mosaicCols(count: number): string {
  if (count >= 5) return "grid-cols-3";
  if (count >= 2) return "grid-cols-2";
  return "grid-cols-1";
}

function PhotoMosaic({
  urls,
  alts,
  onOpen,
}: {
  urls: string[];
  alts: string[];
  onOpen: (src: string, alt: string) => void;
}) {
  if (!urls.length) return null;
  return (
    <div className={clsx("grid gap-0.5 bg-bm-border/40", mosaicCols(urls.length))}>
      {urls.map((src, i) => (
        <button
          key={src}
          type="button"
          onClick={() => onOpen(src, alts[i] ?? alts[0] ?? "")}
          className="relative aspect-square overflow-hidden bg-black"
        >
          <Image
            src={src}
            alt={alts[i] ?? ""}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        </button>
      ))}
    </div>
  );
}

function SideLabel({
  children,
  tone,
}: {
  children: string;
  tone: "before" | "after" | "work";
}) {
  const cls =
    tone === "after"
      ? "bg-bm-red text-white"
      : tone === "before"
        ? "bg-zinc-800 text-white"
        : "bg-sky-700 text-white";
  return (
    <p className={clsx("text-[11px] font-bold uppercase tracking-widest px-3 py-2", cls)}>
      {children}
    </p>
  );
}

export function WorkBeforeAfterCollage({
  item,
}: {
  item: WorkBeforeAfterCase;
}) {
  const { t, locale } = useI18n();
  const lang = documentLocale(locale);
  const w = t.workCases;
  const caption = formatWorkCaseCaption(item, lang, { labor: w.labor, from: w.from });
  const [open, setOpen] = useState<{ src: string; alt: string } | null>(null);

  const beforeAlts = item.before.map((_, i) => `${caption} — ${w.before} ${i + 1}`);
  const afterAlts = item.after.map((_, i) => `${caption} — ${w.after} ${i + 1}`);
  const workAlts = (item.workPhotos ?? []).map((_, i) => `${caption} ${i + 1}`);

  return (
    <article className="rounded-2xl overflow-hidden border border-bm-border/60 bg-bm-card/40">
      <div className="px-4 py-3 border-b border-bm-border/40">
        <h3 className="font-display text-sm sm:text-base uppercase text-glow">{item.job[lang]}</h3>
        <p className="text-xs text-bm-muted mt-1">{caption}</p>
      </div>

      {item.workPhotos?.length && !item.before.length ? (
        <div>
          <SideLabel tone="work">{w.work}</SideLabel>
          <PhotoMosaic urls={item.workPhotos} alts={workAlts} onOpen={(src, alt) => setOpen({ src, alt })} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2">
          <div className="border-b md:border-b-0 md:border-r border-bm-border/40">
            <SideLabel tone="before">{w.before}</SideLabel>
            <PhotoMosaic urls={item.before} alts={beforeAlts} onOpen={(src, alt) => setOpen({ src, alt })} />
          </div>
          <div>
            <SideLabel tone="after">{w.after}</SideLabel>
            <PhotoMosaic urls={item.after} alts={afterAlts} onOpen={(src, alt) => setOpen({ src, alt })} />
          </div>
        </div>
      )}

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
          aria-label={w.close}
        >
          <X className="absolute top-4 right-4 text-white" size={28} />
          <span className="relative w-full max-w-3xl h-[80vh]">
            <Image src={open.src} alt={open.alt} fill className="object-contain" sizes="100vw" />
          </span>
        </button>
      ) : null}
    </article>
  );
}

export function WorkBeforeAfterList({
  cases,
  heading,
  hint,
}: {
  cases: WorkBeforeAfterCase[];
  heading?: string;
  hint?: string;
}) {
  const { t } = useI18n();
  const w = t.workCases;
  if (!cases.length) return null;

  return (
    <div className="space-y-8">
      {heading !== "" ? (
        <div>
          <h2 className="font-display text-xl sm:text-2xl uppercase text-glow">
            {heading ?? w.sectionTitle}
          </h2>
          <p className="text-sm text-bm-muted mt-2 max-w-2xl">{hint ?? w.sectionHint}</p>
        </div>
      ) : null}
      {cases.map((item) => (
        <WorkBeforeAfterCollage key={item.id} item={item} />
      ))}
    </div>
  );
}
