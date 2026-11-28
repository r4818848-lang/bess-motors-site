import type { Metadata } from "next";
import Link from "next/link";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { StructuredData } from "@/components/seo/StructuredData";
import { buildPageMetadata, pageCanonical } from "@/lib/seo-metadata";
import { siteConfig } from "@/lib/site";

const PATH = "/wymiana-plynu-chlodniczego-warszawa";

export const metadata: Metadata = buildPageMetadata({
  title: "Wymiana płynu chłodniczego Warszawa Włochy",
  description:
    "Wymiana płynu chłodniczego i kontrola układu chłodzenia. BESS MOTORS, Warszawa Włochy, al. Krakowska 48/52. Dobór płynu i wycena.",
  path: PATH,
  keywords: [
    "wymiana płynu chłodniczego Warszawa",
    "wymiana płynu chłodniczego Włochy",
    "serwis układu chłodzenia Warszawa",
    "płyn chłodniczy Okęcie",
  ],
});

const questions = [
  {
    question: "Kiedy wymienić płyn chłodniczy?",
    answer:
      "Termin zależy od typu płynu, modelu auta, zaleceń producenta i historii serwisu. Jeśli nie znasz daty ostatniej wymiany, sprawdzimy dokumentację i stan układu.",
  },
  {
    question: "Czy można dolać dowolny płyn chłodniczy?",
    answer:
      "Nie. Płyn powinien spełniać specyfikację producenta pojazdu. Nie dobieramy go wyłącznie po kolorze, ponieważ mieszanie nieodpowiednich płynów może powodować problemy z układem chłodzenia.",
  },
  {
    question: "Ile kosztuje wymiana płynu chłodniczego?",
    answer:
      "Koszt zależy od auta, pojemności układu i wymaganych czynności. Osobno potwierdzamy cenę płynu, materiałów oraz robocizny przed rozpoczęciem prac.",
  },
  {
    question: "Czy wyciek płynu oznacza, że wystarczy go wymienić?",
    answer:
      "Nie. Spadek poziomu może oznaczać nieszczelność. Przed samą wymianą trzeba ustalić przyczynę ubytku, aby nie dopuścić do przegrzania silnika.",
  },
];

export default function CoolantServicePage() {
  const url = pageCanonical(PATH);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Wymiana płynu chłodniczego",
    serviceType: "Serwis układu chłodzenia samochodu",
    url,
    description: "Wymiana płynu chłodniczego i kontrola układu chłodzenia w warsztacie BESS MOTORS w Warszawie.",
    areaServed: { "@type": "City", name: "Warszawa" },
    provider: {
      "@type": "AutoRepair",
      name: "BESS MOTORS",
      telephone: siteConfig.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Aleja Krakowska 48/52",
        addressLocality: "Warszawa",
        addressCountry: "PL",
      },
    },
  };

  return (
    <main className="min-h-screen bg-[#0c0e13] pb-24 pt-28 text-white">
      <StructuredData data={schema} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <nav aria-label="Ścieżka nawigacji" className="mb-8 text-sm text-white/65">
          <Link className="hover:text-white" href="/">BESS MOTORS</Link>
          <span aria-hidden="true"> / </span>
          <Link className="hover:text-white" href="/services">Usługi</Link>
          <span aria-hidden="true"> / </span>
          <span>Wymiana płynu chłodniczego</span>
        </nav>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-bm-accent">Serwis samochodowy • Warszawa Włochy / Okęcie</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight sm:text-5xl">
          Wymiana płynu chłodniczego w Warszawie
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-bm-copy">
          W BESS MOTORS przy al. Krakowskiej 48/52 wykonujemy wymianę płynu chłodniczego
          oraz sprawdzamy podstawowe objawy problemów z układem chłodzenia.
          Dobieramy płyn zgodny z wymaganiami samochodu, a zakres i cenę potwierdzamy przed rozpoczęciem pracy.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <BookingLink trackSource="coolant_service" className="bm-btn-primary inline-flex min-h-12 items-center justify-center rounded-lg px-6 font-semibold">
            Zapytaj o termin wymiany
          </BookingLink>
          <PhoneLink trackSource="coolant_service" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 px-6 font-semibold hover:border-white/50">
            Zadzwoń: {siteConfig.phone}
          </PhoneLink>
        </div>

        <section className="mt-14" aria-labelledby="coolant-work">
          <h2 id="coolant-work" className="font-display text-2xl font-bold sm:text-3xl">Co obejmuje obsługa układu chłodzenia?</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Dobór odpowiedniego płynu", "Sprawdzamy wymaganą specyfikację i dobieramy odpowiedni produkt do modelu oraz silnika."],
              ["Wymiana i odpowietrzenie", "Usuwamy stary płyn i napełniamy układ zgodnie z procedurą przewidzianą dla konkretnego pojazdu."],
              ["Kontrola po serwisie", "Sprawdzamy poziom płynu i podstawowe objawy nieszczelności. Rozszerzoną diagnostykę uzgadniamy osobno."],
            ].map(([heading,description]) => (
              <div key={heading} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">{heading}</h3>
                <p className="mt-3 text-sm leading-6 text-bm-copy">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="coolant-warning">
          <h2 id="coolant-warning" className="font-display text-2xl font-bold sm:text-3xl">Kiedy warto sprawdzić układ chłodzenia?</h2>
          <p className="mt-4 max-w-3xl leading-7 text-bm-copy">
            Zwróć uwagę na regularny ubytek płynu, plamy pod samochodem, nietypowy zapach,
            problemy z ogrzewaniem lub wzrost temperatury silnika. Gdy silnik się przegrzewa,
            zatrzymaj pojazd w bezpiecznym miejscu i nie otwieraj gorącego zbiornika wyrównawczego.
            Samo dolanie płynu nie usuwa przyczyny usterki.
          </p>
        </section>

        <section className="mt-14" aria-labelledby="coolant-faq">
          <h2 id="coolant-faq" className="font-display text-2xl font-bold sm:text-3xl">Najczęstsze pytania</h2>
          <div className="mt-5 space-y-4">
            {questions.map(({question,answer}) => (
              <div key={question} className="rounded-xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold">{question}</h3>
                <p className="mt-2 leading-7 text-bm-copy">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-8" aria-labelledby="coolant-contact">
          <h2 id="coolant-contact" className="font-display text-2xl font-bold">BESS MOTORS — Warszawa Włochy</h2>
          <p className="mt-3 leading-7 text-bm-copy">
            Al. Krakowska 48/52, Warszawa, blisko Okęcia. {siteConfig.workingHours}.
            Opisz markę, model i objawy samochodu. Potwierdzimy zakres, szacunkowy koszt i termin.
            Wysłanie formularza jest prośbą o kontakt, a nie automatycznie potwierdzoną rezerwacją.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <BookingLink trackSource="coolant_bottom" className="font-semibold text-white underline underline-offset-4 hover:text-bm-accent">Umów wizytę</BookingLink>
            <Link href="/hamulce" className="font-semibold text-white underline underline-offset-4 hover:text-bm-accent">Serwis hamulców</Link>
            <Link href="/wymiana-oleju" className="font-semibold text-white underline underline-offset-4 hover:text-bm-accent">Wymiana oleju i filtrów</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
