"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";

type QueueData = {
  activeRepairs: number;
  appointmentsToday: number;
  freeSlotsHint: "low" | "medium" | "high";
};

export function LiveQueueBanner() {
  const { locale } = useI18n();
  const [data, setData] = useState<QueueData | null>(null);

  useEffect(() => {
    fetch("/api/queue")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => null);
  }, []);

  if (!data) return null;

  const load =
    locale === "ru" || locale === "uk"
      ? `Сейчас в работе: ${data.activeRepairs} авто · записей сегодня: ${data.appointmentsToday}`
      : locale === "en"
        ? `In shop now: ${data.activeRepairs} · appointments today: ${data.appointmentsToday}`
        : `W serwisie: ${data.activeRepairs} aut · wizyt dziś: ${data.appointmentsToday}`;

  const hint =
    data.freeSlotsHint === "low"
      ? locale === "ru"
        ? "Свободных слотов мало — лучше записаться онлайн"
        : locale === "en"
          ? "Few slots left — book online"
          : "Mało wolnych terminów — rezerwuj online"
      : data.freeSlotsHint === "high"
        ? locale === "ru"
          ? "Есть свободные окна сегодня"
          : locale === "en"
            ? "Good availability today"
            : "Są wolne terminy dziś"
        : locale === "ru"
          ? "Средняя загрузка — запись онлайн ускорит визит"
          : locale === "en"
            ? "Moderate load — online booking helps"
            : "Średnie obłożenie — rezerwacja online przyspieszy wizytę";

  return (
    <div className="border-y border-bm-border/50 bg-bm-surface/30">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          <p className="font-semibold text-bm-red">{load}</p>
          <p className="text-bm-muted text-xs mt-0.5">{hint}</p>
        </div>
        <Link href="/booking" className="text-bm-red font-bold uppercase text-xs hover:underline">
          {locale === "en" ? "Book" : locale === "ru" ? "Запись" : "Rezerwacja"}
        </Link>
      </div>
    </div>
  );
}
