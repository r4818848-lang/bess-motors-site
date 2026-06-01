"use client";

import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { ServiceId } from "@/lib/services-catalog";
import { SEO_SERVICE_FAQ_PL } from "@/lib/seo-service-faq";
import { Card } from "@/components/ui/Card";

const FAQ_RU: Partial<Record<ServiceId, { q: string; a: string }[]>> = {
  diagnostic: [
    { q: "Сколько длится диагностика?", a: "Обычно 30–60 минут в зависимости от симптомов." },
    { q: "Нужна ли запись?", a: "Да — запись сокращает ожидание." },
  ],
  oil: [
    { q: "Какое масло заливаете?", a: "Подбираем по VIN и пробегу." },
    { q: "Сколько по времени?", a: "Обычно около 1 часа." },
  ],
  brakePads: [
    { q: "Как понять, что колодки изношены?", a: "Писк, удлинённый тормозной путь." },
  ],
};

export function SeoServiceFaq({ serviceId }: { serviceId?: ServiceId }) {
  const { locale, t } = useI18n();
  if (!serviceId) return null;
  const useRu = contentLocale(locale) === "ru";
  const items = useRu
    ? FAQ_RU[serviceId]
    : SEO_SERVICE_FAQ_PL[serviceId];
  if (!items?.length) return null;

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl uppercase mb-4">{t.seoServiceFaq.title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.q} className="p-4">
            <p className="font-semibold text-sm">{item.q}</p>
            <p className="text-bm-muted text-sm mt-2">{item.a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
