"use client";

import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { Card } from "@/components/ui/Card";

const FAQ: Partial<
  Record<
    ServiceId,
    { pl: { q: string; a: string }[]; ru: { q: string; a: string }[] }
  >
> = {
  diagnostic: {
    pl: [
      { q: "Ile trwa diagnostyka?", a: "Zwykle 30–60 min, zależnie od objawów." },
      { q: "Czy muszę zapisać się wcześniej?", a: "Tak — rezerwacja skraca czas oczekiwania." },
    ],
    ru: [
      { q: "Сколько длится диагностика?", a: "Обычно 30–60 минут в зависимости от симптомов." },
      { q: "Нужна ли запись?", a: "Да — запись сокращает ожидание." },
    ],
  },
  oil: {
    pl: [
      { q: "Jaki olej używacie?", a: "Dobieramy specyfikację pod VIN i przebieg." },
      { q: "Czy wymiana trwa długo?", a: "Standardowo ok. 1 godziny." },
    ],
    ru: [
      { q: "Какое масло заливаете?", a: "Подбираем по VIN и пробегу." },
      { q: "Сколько по времени?", a: "Обычно около 1 часа." },
    ],
  },
  brakePads: {
    pl: [
      { q: "Skąd wiem, że klocki są zużyte?", a: "Pisk, dłuższy hamulec, kontrolka ABS." },
    ],
    ru: [{ q: "Как понять, что колодки изношены?", a: "Писк, удлинённый тормозной путь." }],
  },
};

export function SeoServiceFaq({ serviceId }: { serviceId?: ServiceId }) {
  const { locale } = useI18n();
  if (!serviceId) return null;
  const block = FAQ[serviceId];
  if (!block) return null;
  const useRu = locale === "ru" || locale === "uk";
  const items = useRu ? block.ru : block.pl;
  if (!items?.length) return null;

  const title = useRu ? "Частые вопросы" : locale === "en" ? "FAQ" : "Najczęstsze pytania";

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl uppercase mb-4">{title}</h2>
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
