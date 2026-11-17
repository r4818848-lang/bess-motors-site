import { Suspense } from "react";
import GalleryPageClient from "./GalleryPageClient";

/**
 * SSR H1 for crawlers — client island previously left gallery without crawlable H1
 * when JS was deferred.
 */
export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#151922] via-[#0e1117] to-[#080a0f] pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.20em] text-[#ff8581]">
          BESS MOTORS / WARSZAWA
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-[2.4rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-white sm:text-[3.4rem]">
          Galeria — realizacje serwisu BESS MOTORS
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
          Rzeczywiste zdjęcia warsztatu przy Alei Krakowskiej 48/52 oraz naszych napraw:
          hamulce, zawieszenie, klimatyzacja i rozrząd. Zobacz przykłady prac przed i po naprawie.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/70">
          <span className="rounded-full border border-white/15 px-3 py-2">Warszawa Włochy</span>
          <span className="rounded-full border border-white/15 px-3 py-2">Realne zdjęcia</span>
          <span className="rounded-full border border-white/15 px-3 py-2">Przed / po</span>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="pt-10 pb-20 text-center text-bm-muted animate-pulse">…</div>
        }
      >
        <GalleryPageClient hideTitle />
      </Suspense>
    </div>
  );
}
