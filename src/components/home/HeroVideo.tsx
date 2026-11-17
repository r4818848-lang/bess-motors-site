"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Approved BESS MOTORS homepage film: silent 1080p / H.264 / ~8 seconds. */
const VIDEO_SRC = "/videos/bess-motors-hero-2026.mp4";
const POSTER_SRC = "/images/bess-motors-hero-poster.webp";
const FALLBACK_SRC = "/images/banner.png";

type ConnectionNavigator = Navigator & { connection?: { saveData?: boolean } };

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterSrc, setPosterSrc] = useState(POSTER_SRC);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    // Respect user preferences and avoid downloading ~5 MB on data-saving connections.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      (navigator as ConnectionNavigator).connection?.saveData
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && document.visibilityState === "visible") {
          // The source is assigned only when the hero approaches the viewport.
          if (!video.src) {
            video.src = VIDEO_SRC;
            video.load();
          }
          void video.play().catch(() => {
            // Mobile autoplay may be blocked. The poster remains visible.
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.05, rootMargin: "200px" },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [failed]);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden bg-black"
      role="img"
      aria-label="BESS MOTORS: trzy samochody BMW z zielonym, niebieskim i czerwonym podświetleniem w ciemnym studio"
    >
      <Image
        src={posterSrc}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="object-contain"
        onError={() => {
          if (posterSrc !== FALLBACK_SRC) setPosterSrc(FALLBACK_SRC);
        }}
      />
      {!failed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={POSTER_SRC}
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${playing ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
