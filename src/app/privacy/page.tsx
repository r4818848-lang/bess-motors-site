import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Polityka prywatności i RODO — BESS MOTORS Warszawa.",
  alternates: { canonical: `${getSiteUrl()}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl uppercase text-glow mb-6">Polityka prywatności</h1>
      <div className="space-y-4 text-bm-muted text-sm leading-relaxed">
        <p>
          Administratorem danych osobowych jest BESS MOTORS ({siteConfig.address}). Kontakt:{" "}
          <a href={`mailto:${siteConfig.email}`} className="text-bm-red hover:underline">
            {siteConfig.email}
          </a>
          , tel. {siteConfig.phone}.
        </p>
        <p>
          Przetwarzamy dane podane przy rezerwacji wizyty, w koncie klienta, podpisie dokumentów
          oraz w komunikacji (Telegram, e-mail, telefon) — w celu realizacji usług serwisowych,
          rozliczeń i kontaktu z klientem.
        </p>
        <p>
          Podstawa prawna: wykonanie umowy (art. 6 ust. 1 lit. b RODO), prawnie uzasadniony interes
          (art. 6 ust. 1 lit. f RODO) oraz — w razie zgody — marketing (art. 6 ust. 1 lit. a RODO).
        </p>
        <p>
          Dane przechowujemy przez okres niezbędny do obsługi klienta i wymogów księgowych. Masz
          prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych
          oraz sprzeciwu — pisząc na adres e-mail serwisu.
        </p>
        <p>
          Pliki cookies i narzędzia analityczne (Google, Meta) służą statystyce i reklamom —
          możesz je ograniczyć w ustawieniach przeglądarki.
        </p>
      </div>
      <Link href="/" className="inline-block mt-10 text-sm text-bm-red hover:underline">
        ← Strona główna
      </Link>
    </div>
  );
}
