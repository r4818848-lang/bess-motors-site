import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";

export const metadata = {
  title: "Strona nie znaleziona",
  description: "Nie znaleziono strony — BESS MOTORS serwis samochodowy Warszawa.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const siteUrl = getSiteUrl();

  return (
    <div className="pt-32 pb-24 px-4 max-w-lg mx-auto text-center">
      <p className="text-6xl font-display text-bm-red">404</p>
      <h1 className="mt-4 font-display text-xl uppercase">Strona nie znaleziona</h1>
      <p className="mt-3 text-bm-muted text-sm leading-relaxed">
        Adres może być nieprawidłowy lub strona została przeniesiona. Wróć na stronę główną lub
        umów wizytę online.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="btn-primary">
          Strona główna
        </Link>
        <Link href="/booking" className="btn-outline">
          Rezerwacja online
        </Link>
        <Link href="/contacts" className="btn-outline">
          Kontakt
        </Link>
      </div>
      <p className="mt-8 text-xs text-bm-muted">
        <a href={siteUrl} className="hover:text-bm-red transition-colors">
          {siteUrl.replace(/^https?:\/\//, "")}
        </a>
      </p>
    </div>
  );
}
