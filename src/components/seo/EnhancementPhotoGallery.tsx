"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { EnhancementPhoto } from "@/lib/enhancement-gallery";

/**
 * Lightweight masonry gallery for portrait workshop photos.
 * Only the first six images render initially to avoid 20+ network requests
 * on the majority of mobile visits. Full-size preview has keyboard controls.
 */
export function EnhancementPhotoGallery({ photos }: { photos: readonly EnhancementPhoto[] }) {
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visiblePhotos = expanded ? photos : photos.slice(0, 6);

  useEffect(() => {
    if (activeIndex === null) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((index) => index === null ? null : (index - 1 + photos.length) % photos.length);
      if (event.key === "ArrowRight") setActiveIndex((index) => index === null ? null : (index + 1) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeIndex, photos.length]);

  if (!photos.length) return null;

  return (
    <section className="mt-14 scroll-mt-24" aria-labelledby="enhancement-photo-heading" data-testid="enhancement-photo-gallery">
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-bm-accent">GALERIA ZDJĘĆ</p>
          <h2 id="enhancement-photo-heading" className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
            Zobacz przykładowe efekty i etapy prac
          </h2>
        </div>
        <p className="text-sm text-bm-label">{photos.length} zdjęć · kliknij, aby powiększyć</p>
      </div>
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
        {visiblePhotos.map((photo, index) => (
          <button
            type="button"
            key={photo.src}
            onClick={() => setActiveIndex(index)}
            className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/15 bg-[#151820] text-left shadow-[0_18px_35px_rgba(0,0,0,.18)] transition-colors hover:border-bm-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bm-accent"
            aria-label={"Powiększ zdjęcie: " + photo.alt}
            data-testid="enhancement-photo-open"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              quality={75}
              sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1279px) 47vw, 30vw"
              loading="lazy"
              className="block h-auto w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
            />
            <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-white/20 bg-[#06080d]/80 px-3 py-2 text-xs font-semibold text-white">
              <Expand size={14} aria-hidden />
              {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>
      {!expanded && photos.length > 6 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl border border-bm-accent/40 bg-bm-accent/10 px-6 text-sm font-bold text-white transition-colors hover:bg-bm-accent/20"
          data-testid="enhancement-gallery-more"
        >
          Pokaż wszystkie {photos.length} zdjęć
        </button>
      ) : null}

      {activeIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Powiększone zdjęcie usługi"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020308]/95 p-3 sm:p-6"
          onClick={() => setActiveIndex(null)}
          data-testid="enhancement-gallery-lightbox"
        >
          <div className="relative h-[86vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image
              src={photos[activeIndex].src}
              alt={photos[activeIndex].alt}
              fill
              priority
              quality={85}
              sizes="100vw"
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute right-1 top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white"
              aria-label="Zamknij zdjęcie"
              autoFocus
            ><X size={22}/></button>
            <button
              type="button"
              onClick={() => setActiveIndex((activeIndex - 1 + photos.length) % photos.length)}
              className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white sm:left-3"
              aria-label="Poprzednie zdjęcie"
            ><ChevronLeft size={24}/></button>
            <button
              type="button"
              onClick={() => setActiveIndex((activeIndex + 1) % photos.length)}
              className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white sm:right-3"
              aria-label="Następne zdjęcie"
            ><ChevronRight size={24}/></button>
            <p className="absolute bottom-0 left-0 right-0 z-10 rounded-xl bg-black/75 p-3 text-center text-xs text-white sm:text-sm">
              {photos[activeIndex].alt} · {activeIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
