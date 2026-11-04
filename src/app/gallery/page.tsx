import { Suspense } from "react";
import GalleryPageClient from "./GalleryPageClient";

/**
 * SSR H1 for crawlers — client island previously left gallery without crawlable H1
 * when JS was deferred.
 */
export default function GalleryPage() {
  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h1 className="font-display text-4xl font-bold uppercase text-glow">
          Galeria — realizacje serwisu BESS MOTORS
        </h1>
        <p className="mt-4 text-bm-muted max-w-2xl">
          Zdjęcia warsztatu przy Alei Krakowskiej 48/52 (Warszawa Włochy) oraz przykłady
          wykonanych napraw — hamulce, zawieszenie, klimatyzacja, rozrząd.
        </p>
        <div className="mt-4 h-1 w-24 bg-bm-red shadow-neon-sm" />
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
