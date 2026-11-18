import { BookingPageClient } from "@/components/booking/BookingPageClient";
import { siteConfig } from "@/lib/site";

/**
 * Server-rendered booking shell so crawlers see H1, NAP and CTAs
 * without waiting for the client form island.
 */
export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#151922] via-[#0c1016] to-bm-black pb-24 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <header className="mb-9 max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.19em] text-bm-accent">BESS MOTORS / WARSZAWA WŁOCHY</p>
          <h1 className="mt-3 font-display text-[2.5rem] font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-[3.4rem]">
            Umów wizytę — BESS MOTORS
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-bm-copy">
            Wybierz usługi z cennika i zostaw telefon. Potwierdzimy termin telefonicznie. Bez konta
            i logowania.
          </p>
          <p className="mt-3 max-w-xl text-sm text-bm-label">
            {siteConfig.address} ·{" "}
            <a href={siteConfig.phoneHref} className="text-bm-red font-semibold hover:underline">
              {siteConfig.phone}
            </a>
          </p>
        </header>
        <BookingPageClient />

        <section aria-labelledby="booking-how" className="mt-14 border-t border-white/10 pt-10">
          <h2 id="booking-how" className="font-display text-2xl font-bold text-white sm:text-3xl">
            Jak umówić samochód do serwisu w Warszawie?
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-bm-copy">
            BESS MOTORS znajduje się przy Alei Krakowskiej 48/52 w dzielnicy Włochy,
            niedaleko Okęcia. W formularzu podaj usługę i dane kontaktowe. Oddzwonimy
            lub skontaktujemy się, aby potwierdzić termin i zakres prac.
            Samo wysłanie zgłoszenia nie oznacza jeszcze potwierdzonej wizyty.
          </p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white">1. Opisz potrzebę</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">
                Wybierz usługę. Przy wycenie części przyda się marka, model, silnik
                oraz VIN samochodu.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white">2. Uzgodnij wycenę</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">
                Przed pracą ustalimy cenę robocizny i potrzebnych części.
                Dodatkowe naprawy wymagają wcześniejszego uzgodnienia.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white">3. Potwierdź termin</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">
                Wizyta jest potwierdzona dopiero po kontakcie z warsztatem.
                W pilnej sprawie zadzwoń pod numer {siteConfig.phone}.
              </p>
            </div>
          </div>
          <h2 className="mt-10 font-display text-2xl font-bold text-white">Najczęściej wybierane usługi</h2>
          <nav aria-label="Usługi serwisu BESS MOTORS" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a className="rounded-lg border border-white/15 p-4 text-white hover:border-bm-red" href="/wymiana-opon-warszawa">Wymiana opon i wyważanie kół — Warszawa</a>
            <a className="rounded-lg border border-white/15 p-4 text-white hover:border-bm-red" href="/wymiana-oleju">Wymiana oleju i filtrów</a>
            <a className="rounded-lg border border-white/15 p-4 text-white hover:border-bm-red" href="/hamulce">Klocki, tarcze i naprawa hamulców</a>
            <a className="rounded-lg border border-white/15 p-4 text-white hover:border-bm-red" href="/naprawa-zawieszenia-warszawa">Naprawa zawieszenia</a>
            <a className="rounded-lg border border-white/15 p-4 text-white hover:border-bm-red" href="/wymiana-plynu-hamulcowego-warszawa">Wymiana płynu hamulcowego</a>
            <a className="rounded-lg border border-white/15 p-4 text-white hover:border-bm-red" href="/wymiana-plynu-chlodniczego-warszawa">Wymiana płynu chłodniczego</a>
          </nav>
          <p className="mt-7 text-sm leading-6 text-bm-copy">
            Godziny warsztatu: {siteConfig.workingHours}. Kontakt telefoniczny:{" "}
            <a className="font-semibold text-white underline hover:text-bm-red" href={siteConfig.phoneHref}>{siteConfig.phone}</a>.
            Nie wykonujemy geometrii kół ani dynamicznej wymiany oleju ATF.
          </p>
        </section>
      </div>
    </div>
  );
}
