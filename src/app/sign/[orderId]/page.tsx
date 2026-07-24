"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";

/** Electronic signature for clients is disabled — contact the workshop. */
export default function SignWorkOrderRetiredPage() {
  const { t, locale } = useI18n();
  const copy =
    locale === "ru"
      ? {
          title: "Электронная подпись отключена",
          body: "Мы свяжемся с вами по телефону. Запишитесь онлайн или позвоните в сервис.",
        }
      : locale === "uk"
        ? {
            title: "Електронний підпис вимкнено",
            body: "Ми зв’яжемося з вами телефоном. Запишіться онлайн або зателефонуйте в сервіс.",
          }
        : locale === "en"
          ? {
              title: "E-signature is disabled",
              body: "We will contact you by phone. Book online or call the workshop.",
            }
          : {
              title: "Podpis elektroniczny wyłączony",
              body: "Skontaktujemy się telefonicznie. Umów wizytę online lub zadzwoń do serwisu.",
            };

  return (
    <div className="pt-28 pb-24 min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="font-display text-2xl font-bold uppercase text-white">{copy.title}</h1>
        <p className="text-bm-muted leading-relaxed">{copy.body}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <BookingLink trackSource="sign_retired" className="btn-primary inline-flex justify-center">
            {t.nav.booking}
          </BookingLink>
          <PhoneLink trackSource="sign_retired" className="btn-outline inline-flex justify-center gap-2">
            <Phone size={16} />
            {siteConfig.phone}
          </PhoneLink>
        </div>
        <Link href="/contacts" className="block text-sm text-bm-muted hover:text-bm-red">
          {t.nav.contacts}
        </Link>
      </div>
    </div>
  );
}
