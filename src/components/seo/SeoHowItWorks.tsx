"use client";

import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { WaitTimeEstimator } from "@/components/booking/WaitTimeEstimator";
import { Card } from "@/components/ui/Card";

const STEPS_PL = [
  "Rezerwacja online lub telefon",
  "Przyjęcie auta i diagnostyka",
  "Akceptacja kosztorysu (podpis)",
  "Naprawa i odbiór",
];

const STEPS_RU = [
  "Запись онлайн или по телефону",
  "Приём авто и диагностика",
  "Согласование сметы (подпись)",
  "Ремонт и выдача",
];

export function SeoHowItWorks({ serviceId }: { serviceId?: ServiceId }) {
  const { locale } = useI18n();
  const steps = locale === "ru" || locale === "uk" ? STEPS_RU : STEPS_PL;
  const title =
    locale === "ru" || locale === "uk"
      ? "Как проходит услуга"
      : locale === "en"
        ? "How it works"
        : "Jak przebiega usługa";

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl uppercase mb-4">{title}</h2>
      <ol className="grid sm:grid-cols-2 gap-3 mb-6">
        {steps.map((s, i) => (
          <Card key={s} className="p-4 flex gap-3">
            <span className="text-bm-red font-bold">{i + 1}</span>
            <span className="text-sm">{s}</span>
          </Card>
        ))}
      </ol>
      <WaitTimeEstimator serviceId={serviceId} />
    </section>
  );
}
