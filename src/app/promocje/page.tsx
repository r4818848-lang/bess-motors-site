"use client";

import Link from "next/link";
import { OilBrakePromoBanner } from "@/components/home/OilBrakePromoBanner";
import { SeasonalAcBanner } from "@/components/home/SeasonalAcBanner";
import { PromoBanner } from "@/components/home/PromoBanner";
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
      ? "Специальные цены на масло и тормоза по коду BessMotors, акция −50% на заправку кондиционера и −15% на остальные услуги."
      : locale === "en"
        ? "Special oil & brake prices with code BessMotors, −50% A/C recharge, and −15% on other services."
        : "Specjalne ceny oleju i hamulców z kodem BessMotors, promocja −50% na nabijanie klimatyzacji oraz −15% na pozostałe usługi.";

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 mb-10 text-center">
        <h1 className="font-display text-4xl font-bold uppercase text-glow">{title}</h1>
        <p className="mt-3 text-bm-muted max-w-2xl mx-auto">{intro}</p>
        <BookingLink trackSource="promocje_page" className="btn-primary mt-6 inline-flex">
          {t.nav.booking}
        </BookingLink>
      </div>
      <OilBrakePromoBanner />
      <div className="my-4" />
      <SeasonalAcBanner />
      <div className="my-4" />
      <PromoBanner />
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
