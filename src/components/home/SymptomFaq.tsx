"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { symptomFaq } from "@/lib/symptom-faq";
import { bookingUrlForService } from "@/lib/brand-service-links";
import type { ServiceId } from "@/lib/services-catalog";

export function SymptomFaq() {
  const { locale } = useI18n();
  const useRu = locale === "ru" || locale === "uk";
  const [open, setOpen] = useState<string | null>(symptomFaq[0]?.id ?? null);

  const title = useRu ? "Частые симптомы" : locale === "en" ? "Common symptoms" : "Typowe objawy";

  return (
    <section className="py-16 border-t border-bm-border/40">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="font-display text-2xl font-bold uppercase mb-8 text-center">{title}</h2>
        <div className="space-y-2">
          {symptomFaq.map((entry) => {
            const isOpen = open === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border border-bm-border/50 overflow-hidden">
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 font-semibold hover:bg-bm-card/60"
                  onClick={() => setOpen(isOpen ? null : entry.id)}
                >
                  {useRu ? entry.questionRu : entry.questionPl}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-bm-muted space-y-3">
                    <p>{useRu ? entry.answerRu : entry.answerPl}</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.serviceIds.map((sid) => (
                        <Link
                          key={sid}
                          href={bookingUrlForService(sid as ServiceId)}
                          className="text-xs text-bm-red font-bold uppercase hover:underline"
                        >
                          → {sid}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
