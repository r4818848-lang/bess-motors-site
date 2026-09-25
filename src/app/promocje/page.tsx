"use client";

import Link from "next/link";
import { OilBrakePromoBanner } from "@/components/home/OilBrakePromoBanner";
import { FreeSuspensionPromoBanner } from "@/components/home/FreeSuspensionPromoBanner";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

export default function PromocjePage() {
  const { t, locale } = useI18n();
  const title =
    locale === "ru"
      ? "Акции BESS MOTORS"
      : locale === "en"
        ? "BESS MOTORS promotions"
        : locale === "uk"
          ? "Акції BESS MOTORS"
          : "Promocje BESS MOTORS";
  const intro =
    locale === "ru"
      ? "Замена масла 80 zł + диагностика подвески бесплатно при замене масла. Тормоза по коду BessMotors."
      : locale === "en"
        ? "Oil change 80 PLN + free suspension check with the oil change. Brakes with code BessMotors."
        : locale === "uk"
          ? "Заміна оливи 80 zł + діагностика підвіски безкоштовно при заміні оливи. Гальма за кодом BessMotors."
          : "Wymiana oleju 80 zł + diagnostyka zawieszenia gratis przy wymianie oleju. Hamulce z kodem BessMotors.";

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 mb-10 text-center">
        <h1 className="font-display text-4xl font-bold uppercase">{title}</h1>
        <p className="mt-3 text-bm-muted max-w-2xl mx-auto">{intro}</p>
        <BookingLink trackSource="promocje_page" className="btn-primary mt-6 inline-flex">
          {t.nav.booking}
        </BookingLink>
      </div>
      <OilBrakePromoBanner />
      <div className="my-4" />
      <FreeSuspensionPromoBanner />
      <div className="mx-auto max-w-7xl px-4 lg:px-8 mt-10 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/wymiana-oleju" className="text-bm-red hover:underline">
          /wymiana-oleju
        </Link>
        <Link href="/hamulce" className="text-bm-red hover:underline">
          /hamulce
        </Link>
        <Link href="/klimatyzacja" className="text-bm-red hover:underline">
          /klimatyzacja
        </Link>
      </div>
    </div>
  );
}
