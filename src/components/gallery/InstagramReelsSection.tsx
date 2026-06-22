"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, X, ExternalLink, Instagram } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import {
  INSTAGRAM_REELS,
  instagramReelEmbedUrl,
  type InstagramReel,
} from "@/lib/instagram-reels";
import { siteConfig } from "@/lib/site";

function ReelCard({
  reel,
  onPlay,
}: {
  reel: InstagramReel;
  onPlay: (reel: InstagramReel) => void;
}) {
  const { locale, t } = useI18n();
  const lang = contentLocale(locale);
  const ir = t.instagramReels;

  return (
    <article className="group relative rounded-2xl overflow-hidden border border-bm-border/50 bg-bm-card/40 hover:border-bm-red/40 transition-all hover:shadow-neon-sm">
      <button
        type="button"
        onClick={() => onPlay(reel)}
        className="relative block w-full aspect-[9/16] max-h-[420px] text-left"
        aria-label={`${ir.watchReel}: ${reel.title[lang]}`}
      >
        <Image
          src={reel.posterSrc}
          alt={reel.title[lang]}
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
        <div className="absolute top-3 right-3 rounded-full bg-black/60 p-1.5">
          <Instagram size={16} className="text-white" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-display text-sm uppercase text-white">{reel.title[lang]}</p>
          <p className="text-xs text-white/75 mt-1 line-clamp-2">{reel.caption[lang]}</p>
        </div>
      </button>
    </article>
  );
}

function ReelModal({
  reel,
  onClose,
}: {
  reel: InstagramReel;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  const lang = contentLocale(locale);
  const ir = t.instagramReels;

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={reel.title[lang]}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white"
          aria-label={ir.close}
        >
          <X size={24} />
        </button>
        <div className="rounded-2xl overflow-hidden border border-bm-border/60 bg-black shadow-2xl">
          <iframe
            src={instagramReelEmbedUrl(reel.shortcode)}
            title={reel.title[lang]}
            className="w-full aspect-[9/16] min-h-[480px] border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-sm uppercase text-white">{reel.title[lang]}</p>
          <Link
            href={reel.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink size={12} />
            {ir.openInstagram}
          </Link>
        </div>
      </div>
    </div>
  );
}

type Props = {
  className?: string;
  showHeader?: boolean;
};

export function InstagramReelsSection({ className = "", showHeader = true }: Props) {
  const { t } = useI18n();
  const ir = t.instagramReels;
  const [active, setActive] = useState<InstagramReel | null>(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <section className={className} aria-labelledby="instagram-reels-heading">
      {showHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 id="instagram-reels-heading" className="font-display text-2xl uppercase text-glow">
              {ir.title}
            </h2>
            <p className="text-sm text-bm-muted mt-2 max-w-2xl">{ir.subtitle}</p>
          </div>
          <Link
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-sm inline-flex items-center gap-2"
          >
            <Instagram size={16} />
            @bessmotors.pl
          </Link>
        </div>
      ) : (
        <h2 id="instagram-reels-heading" className="sr-only">
          {ir.title}
        </h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {INSTAGRAM_REELS.map((reel) => (
          <ReelCard key={reel.id} reel={reel} onPlay={setActive} />
        ))}
      </div>

      {active ? <ReelModal reel={active} onClose={close} /> : null}
    </section>
  );
}
