import { BookingPageClient } from "@/components/booking/BookingPageClient";
import { siteConfig } from "@/lib/site";

/**
 * Server-rendered booking shell so crawlers see H1, NAP and CTAs
 * without waiting for the client form island.
 */
export default function BookingPage() {
  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <header className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold uppercase text-glow">
            Umów wizytę — BESS MOTORS
          </h1>
          <p className="mt-3 text-bm-muted max-w-2xl mx-auto">
            Wybierz usługi z cennika i zostaw telefon. Potwierdzimy termin telefonicznie. Bez konta
            i logowania.
          </p>
          <p className="mt-3 flex flex-col items-center gap-1 text-sm text-bm-silver/90 sm:flex-row sm:justify-center sm:gap-3">
            <span className="max-w-[18rem] text-center sm:max-w-none">{siteConfig.address}</span>
            <a
              href={siteConfig.phoneHref}
              className="inline-flex min-h-[44px] items-center whitespace-nowrap font-semibold text-bm-ink hover:underline"
            >
              {siteConfig.phone}
            </a>
          </p>
        </header>
        <BookingPageClient />
      </div>
    </div>
  );
}
