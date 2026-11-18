import Link from "next/link";
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
      <section aria-labelledby="gallery-services" className="mx-auto mt-12 max-w-7xl border-t border-white/10 px-4 pt-10 lg:px-8">
        <h2 id="gallery-services" className="font-display text-2xl font-bold text-white sm:text-3xl">
          Zobacz, jakie usługi wykonujemy w warsztacie
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
          Galeria pomaga zobaczyć stanowiska pracy i przykłady obsługi samochodów w BESS MOTORS.
          Opis i koszt konkretnej naprawy zawsze ustalamy indywidualnie, po sprawdzeniu samochodu
          oraz doborze części. Nasz serwis mieści się w Warszawie Włochy, przy Alei Krakowskiej 48/52.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/wymiana-opon-warszawa" className="rounded-xl border border-white/15 p-5 text-white hover:border-[#ff8581]">
            <h3 className="font-semibold">Wymiana opon</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">Sezonowa wymiana opon, wyważanie i cennik w Warszawie.</p>
          </Link>
          <Link href="/wymiana-oleju" className="rounded-xl border border-white/15 p-5 text-white hover:border-[#ff8581]">
            <h3 className="font-semibold">Wymiana oleju</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">Wymiana oleju i filtrów, dobór produktów do silnika.</p>
          </Link>
          <Link href="/hamulce" className="rounded-xl border border-white/15 p-5 text-white hover:border-[#ff8581]">
            <h3 className="font-semibold">Hamulce</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">Kontrola układu, wymiana klocków i tarcz.</p>
          </Link>
          <Link href="/naprawa-zawieszenia-warszawa" className="rounded-xl border border-white/15 p-5 text-white hover:border-[#ff8581]">
            <h3 className="font-semibold">Zawieszenie</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">Diagnostyka stuków i luzów, naprawa wahaczy i amortyzatorów.</p>
          </Link>
        </div>
        <p className="mt-6 text-sm text-white/65">
          Chcesz umówić wizytę? <Link href="/booking" className="font-semibold text-white underline hover:text-[#ff8581]">Wyślij zgłoszenie do warsztatu</Link> — termin potwierdzimy po kontakcie.
        </p>
      </section>
    </div>
  );
}
