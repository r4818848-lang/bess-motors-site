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
          <p className="text-xs font-bold uppercase tracking-[0.19em] text-[#ff7974]">BESS MOTORS / WARSZAWA WŁOCHY</p>
          <h1 className="mt-3 font-display text-[2.5rem] font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-[3.4rem]">
            Umów wizytę — BESS MOTORS
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
            Wybierz usługi z cennika i zostaw telefon. Potwierdzimy termin telefonicznie. Bez konta
            i logowania.
          </p>
          <p className="mt-3 max-w-xl text-sm text-white/55">
            {siteConfig.address} ·{" "}
            <a href={siteConfig.phoneHref} className="text-bm-red font-semibold hover:underline">
              {siteConfig.phone}
            </a>
          </p>
        </header>
        <BookingPageClient />
      </div>
    </div>
  );
}
