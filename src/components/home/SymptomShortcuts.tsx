import Link from "next/link";

const symptoms = [
  { href: "/diagnostyka-zawieszenia-warszawa", label: "Coś stuka" },
  { href: "/check-engine", label: "Świeci kontrolka" },
  { href: "/hamulce-warszawa", label: "Auto słabo hamuje" },
  { href: "/klimatyzacja", label: "Klimatyzacja nie chłodzi" },
  { href: "/diagnostyka-silnika-warszawa", label: "Silnik pracuje nierówno" },
  { href: "/wymiana-oleju-warszawa", label: "Chcę wymienić olej" },
  { href: "/wulkanizacja-warszawa", label: "Potrzebuję wymiany opon" },
];

/** Existing service pages, reached in one tap. This does not diagnose the car. */
export function SymptomShortcuts() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h2 className="font-display text-2xl font-bold uppercase text-white">Co dzieje się z Twoim autem?</h2>
      <p className="mt-2 max-w-2xl text-sm text-bm-muted">
        Wybierz objaw. Otworzymy odpowiednią usługę warsztatu w Warszawie. To nie jest diagnoza konkretnego samochodu.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {symptoms.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white hover:border-bm-red"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
