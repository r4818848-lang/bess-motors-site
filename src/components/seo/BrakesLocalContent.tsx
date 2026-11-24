import Link from "next/link";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { siteConfig } from "@/lib/site";
import { getServicePrice, formatServicePricePl, OIL_BRAKE_PROMO_CODE, OIL_BRAKE_PROMO_VALID_UNTIL } from "@/lib/service-prices";
import type { ServicePriceId } from "@/lib/service-prices";

const brakeItems: { id: ServicePriceId; label: string }[] = [
  { id: "brake_pads_front", label: "Klocki przednie" },
  { id: "brake_disc_front", label: "Tarcze i klocki przednie" },
  { id: "brake_pads_rear", label: "Klocki tylne" },
  { id: "brake_disc_rear", label: "Tarcze i klocki tylne" },
];

/** Server-rendered, descriptive local copy for /hamulce. No invented case studies or availability. */
export function BrakesLocalContent() {
  const prices = brakeItems.flatMap(({ id, label }) => {
    const price = getServicePrice(id);
    return price ? [{ id, label, value: formatServicePricePl(price), promo: price.promoPrice !== undefined }] : [];
  });
  return (
    <section className="bg-[#0c0e13] pb-20 text-white" aria-labelledby="brakes-local-heading">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-bm-accent">BESS MOTORS • Warszawa Włochy / Okęcie</p>
          <h2 id="brakes-local-heading" className="mt-3 font-display text-2xl font-bold sm:text-3xl">
            Naprawa i wymiana hamulców w Warszawie — jak wygląda wizyta?
          </h2>
          <p className="mt-4 max-w-4xl leading-7 text-bm-copy">
            W naszym warsztacie przy Alei Krakowskiej 48/52 wykonujemy kontrolę układu hamulcowego,
            wymianę przednich i tylnych klocków, tarcz oraz płynu hamulcowego. Zgłoś piski,
            wibracje przy hamowaniu, słabsze działanie hamulców lub komunikat na desce rozdzielczej.
            Wycena zależy od modelu samochodu, stanu elementów i doboru części.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">1. Ocena stanu hamulców</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">Weryfikujemy objawy i wskazujemy, które elementy wymagają naprawy, a które nadal nadają się do użytkowania.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">2. Wycena przed naprawą</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">Ustalamy osobno robociznę, części oraz ewentualne dodatkowe czynności. Bez uzgodnienia nie rozszerzamy zakresu prac.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">3. Wymiana i kontrola</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">Po wymianie sprawdzamy poprawność wykonanych prac zgodnie z wymaganiami danego pojazdu.</p>
            </div>
          </div>
          <h2 className="mt-10 text-xl font-bold">Ile kosztuje wymiana klocków i tarcz?</h2>
          <p className="mt-3 max-w-4xl leading-7 text-bm-copy">
            Poniższe stawki dotyczą robocizny na jedną oś w typowym samochodzie osobowym.
            Części, czujniki zużycia i dodatkowe czynności wyceniamy osobno.
            Ostateczny koszt potwierdzamy przed rozpoczęciem naprawy.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {prices.map(({ id, label, value, promo }) => (
              <div key={id} className="rounded-xl border border-white/10 p-4">
                <dt className="text-sm text-bm-copy">{label}</dt>
                <dd className="mt-1 text-lg font-bold">{value}</dd>
                {promo ? <p className="mt-1 text-xs text-bm-copy">Kod {OIL_BRAKE_PROMO_CODE}, do {OIL_BRAKE_PROMO_VALID_UNTIL}</p> : null}
              </div>
            ))}
          </dl>
          <h2 className="mt-10 text-xl font-bold">Kiedy wymienić klocki, a kiedy również tarcze?</h2>
          <p className="mt-3 max-w-4xl leading-7 text-bm-copy">
            Nie ma jednego przebiegu odpowiedniego dla wszystkich samochodów. Decydują pomiar
            grubości okładziny i tarczy, granica zużycia określona przez producenta, stan powierzchni
            oraz działanie zacisków. Kontrolę warto wykonać przy komunikacie o zużyciu, piskach lub
            drganiach przy hamowaniu. Tarcze wymienia się parami na osi; zakres naprawy ustalamy po oględzinach.
          </p>
          <h2 className="mt-10 text-xl font-bold">Czy wymieniacie płyn hamulcowy i czujniki zużycia?</h2>
          <p className="mt-3 max-w-4xl leading-7 text-bm-copy">
            Tak. Dobieramy płyn według specyfikacji pojazdu i sprawdzamy wymagany przez producenta
            interwał wymiany. W samochodach z elektronicznym hamulcem postojowym lub czujnikami
            zużycia zakres obsługi zależy od wyposażenia i procedury serwisowej. Podaj model, rocznik
            oraz VIN przy zapytaniu o wycenę; części i robociznę potwierdzimy przed wizytą.
          </p>
          <h2 className="mt-10 text-xl font-bold">Czy można jechać z uszkodzonymi hamulcami?</h2>
          <p className="mt-3 max-w-4xl leading-7 text-bm-copy">
            Jeżeli pedał hamulca zachowuje się nieprawidłowo, pojawia się wyciek płynu
            lub samochód wyraźnie traci skuteczność hamowania, nie kontynuuj jazdy.
            Skontaktuj się z warsztatem w celu ustalenia bezpiecznego sposobu dostarczenia pojazdu.
          </p>
          <p className="mt-8 text-sm leading-6 text-bm-copy">
            BESS MOTORS, Aleja Krakowska 48/52, Warszawa Włochy, okolice Okęcia.
            Termin wizyty potwierdzamy po kontakcie.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <BookingLink trackSource="brakes_local" className="bm-btn-primary inline-flex min-h-12 items-center justify-center rounded-lg px-6 font-bold">Poproś o termin</BookingLink>
            <PhoneLink trackSource="brakes_local" className="inline-flex min-h-12 items-center rounded-lg border border-white/20 px-6 font-bold">Zadzwoń: {siteConfig.phone}</PhoneLink>
            <Link href="/diagnostyka-komputerowa-warszawa" className="inline-flex min-h-12 items-center font-semibold underline underline-offset-4">Diagnostyka komputerowa samochodu</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
