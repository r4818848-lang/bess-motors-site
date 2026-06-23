"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, X, ExternalLink, Instagram } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { ServiceId } from "@/lib/services-catalog";
import { OUR_WORK_VIDEOS, type OurWorkVideo } from "@/lib/our-works";

function WorkDescription({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm text-bm-muted leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => line.startsWith("✅") || line.trim() === "");
        if (isList) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines
                .filter((line) => line.startsWith("✅"))
                .map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="shrink-0">{line.slice(0, 2)}</span>
                    <span>{line.slice(2).trim()}</span>
                  </li>
                ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}

function WorkVideoPlayer({
  work,
  autoPlay = false,
  className = "",
}: {
  work: OurWorkVideo;
  autoPlay?: boolean;
  className?: string;
}) {
  return (
    <video
      key={work.id}
      className={`w-full aspect-[9/16] max-h-[70vh] bg-black object-contain ${className}`}
      controls
      playsInline
      preload="metadata"
      poster={work.posterSrc}
      autoPlay={autoPlay}
    >
      <source src={work.videoSrc} type="video/quicktime" />
      <source src={work.videoSrc} type="video/mp4" />
    </video>
  );
}

function WorkCard({
  work,
  onPlay,
}: {
  work: OurWorkVideo;
  onPlay: (work: OurWorkVideo) => void;
}) {
  const { locale, t } = useI18n();
  const lang = contentLocale(locale);
  const ow = t.ourWorks;

  return (
    <article className="group relative rounded-2xl overflow-hidden border border-bm-border/50 bg-bm-card/40 hover:border-bm-red/40 transition-all hover:shadow-neon-sm">
      <button
        type="button"
        onClick={() => onPlay(work)}
        className="relative block w-full aspect-[9/16] max-h-[420px] text-left"
        aria-label={`${ow.watchVideo}: ${work.title[lang]}`}
      >
        <Image
          src={work.posterSrc}
          alt={work.title[lang]}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bm-red/90 text-white shadow-neon-sm ring-4 ring-white/20 transition-transform group-hover:scale-110">
            <Play size={28} className="ml-1" fill="currentColor" />
          </span>
        </div>
        {work.instagramUrl ? (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 p-1.5">
            <Instagram size={16} className="text-white" />
          </div>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-display text-sm uppercase text-white">{work.title[lang]}</p>
          <p className="text-xs text-white/75 mt-1 line-clamp-2">
            {work.description[lang].split("\n")[0]}
          </p>
        </div>
      </button>
    </article>
  );
}

function WorkModal({
  work,
  onClose,
}: {
  work: OurWorkVideo;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  const lang = contentLocale(locale);
  const ow = t.ourWorks;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={work.title[lang]}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white"
          aria-label={ow.close}
        >
          <X size={24} />
        </button>
        <div className="rounded-2xl overflow-hidden border border-bm-border/60 bg-bm-card/90 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="bg-black flex items-center justify-center">
              <WorkVideoPlayer work={work} autoPlay />
            </div>
            <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto">
              <h3 className="font-display text-lg uppercase text-bm-red mb-4">
                {work.title[lang]}
              </h3>
              <WorkDescription text={work.description[lang]} />
              {work.instagramUrl ? (
                <Link
                  href={work.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs inline-flex items-center gap-1.5 mt-6"
                >
                  <ExternalLink size={12} />
                  {ow.openInstagram}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SectionProps = {
  className?: string;
  showHeader?: boolean;
  serviceId?: ServiceId;
  compact?: boolean;
};

export function OurWorksSection({
  className = "",
  showHeader = true,
  serviceId,
  compact = false,
}: SectionProps) {
  const { t } = useI18n();
  const ow = t.ourWorks;
  const [active, setActive] = useState<OurWorkVideo | null>(null);
  const close = useCallback(() => setActive(null), []);

  const items = serviceId
    ? OUR_WORK_VIDEOS.filter((work) => work.serviceIds.includes(serviceId))
    : OUR_WORK_VIDEOS;

  if (!items.length) return null;

  return (
    <section className={className} aria-labelledby="our-works-heading">
      {showHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 id="our-works-heading" className="font-display text-2xl uppercase text-glow">
              {ow.title}
            </h2>
            <p className="text-sm text-bm-muted mt-2 max-w-2xl">{ow.subtitle}</p>
          </div>
        </div>
      ) : (
        <h2 id="our-works-heading" className="sr-only">
          {ow.title}
        </h2>
      )}

      <div
        className={
          compact
            ? "grid grid-cols-1 gap-5"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        }
      >
        {items.map((work) => (
          <WorkCard key={work.id} work={work} onPlay={setActive} />
        ))}
      </div>

      {active ? <WorkModal work={active} onClose={close} /> : null}
    </section>
  );
}

type InlineProps = {
  serviceId: ServiceId;
  className?: string;
};

/** Compact teaser for booking modal */
export function BookingWorkVideoTeaser({ serviceId }: { serviceId: ServiceId }) {
  const { locale, t } = useI18n();
  const lang = contentLocale(locale);
  const ow = t.ourWorks;
  const works = OUR_WORK_VIDEOS.filter((work) => work.serviceIds.includes(serviceId));
  const [playing, setPlaying] = useState(false);

  if (!works.length) return null;

  const work = works[0];

  return (
    <div className="rounded-xl border border-bm-border/50 bg-black/30 overflow-hidden">
      {playing ? (
        <WorkVideoPlayer work={work} autoPlay className="max-h-[320px] mx-auto" />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="relative flex w-full items-center gap-3 p-3 text-left"
        >
          <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={work.posterSrc}
              alt={work.title[lang]}
              fill
              sizes="56px"
              className="object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Play size={18} className="text-white ml-0.5" fill="currentColor" />
            </span>
          </span>
          <span>
            <span className="block text-[10px] uppercase text-bm-red tracking-wide">
              {ow.serviceVideoTitle}
            </span>
            <span className="block text-sm font-semibold text-white mt-0.5">
              {work.title[lang]}
            </span>
            <span className="block text-[10px] text-bm-muted mt-1">{ow.watchVideo}</span>
          </span>
        </button>
      )}
    </div>
  );
}

/** Compact video block for service landing pages */
export function ServiceWorkVideo({ serviceId, className = "" }: InlineProps) {
  const { locale, t } = useI18n();
  const lang = contentLocale(locale);
  const ow = t.ourWorks;
  const works = OUR_WORK_VIDEOS.filter((work) => work.serviceIds.includes(serviceId));

  if (!works.length) return null;

  const work = works[0];

  return (
    <section className={className} aria-labelledby="service-work-video-heading">
      <h2
        id="service-work-video-heading"
        className="font-display text-xl uppercase text-bm-red mb-2"
      >
        {ow.serviceVideoTitle}
      </h2>
      <p className="text-sm text-bm-muted mb-4">{ow.serviceVideoHint}</p>
      <div className="rounded-2xl overflow-hidden border border-bm-border/50 bg-bm-card/40">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="bg-black">
            <WorkVideoPlayer work={work} />
          </div>
          <div className="p-5 sm:p-6">
            <h3 className="font-display text-sm uppercase text-white mb-3">
              {work.title[lang]}
            </h3>
            <WorkDescription text={work.description[lang]} />
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/gallery?tab=works" className="btn-outline text-xs">
                {ow.viewAllWorks}
              </Link>
              {work.instagramUrl ? (
                <Link
                  href={work.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs inline-flex items-center gap-1.5"
                >
                  <Instagram size={12} />
                  {ow.openInstagram}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
