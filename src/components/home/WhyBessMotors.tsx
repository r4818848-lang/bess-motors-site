"use client";

import {
  ClipboardCheck,
  Fingerprint,
  MessageSquare,
  Receipt,
  CreditCard,
  Cpu,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const ICONS = [ClipboardCheck, Fingerprint, MessageSquare, Receipt, CreditCard, Cpu] as const;

/** Concrete advantages — no empty superlatives (TZ §26) */
export function WhyBessMotors() {
  const { t } = useI18n();
  const w = t.whyBess;

  return (
    <section className="py-12 sm:py-16 border-t border-white/10" aria-labelledby="why-bess-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          id="why-bess-heading"
          className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
        >
          {w.title}
        </h2>
        <p className="mt-2 text-sm text-bm-muted max-w-2xl">{w.subtitle}</p>
        <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {w.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li
                key={item.title}
                className="rounded-xl border border-white/10 bg-bm-card p-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <Icon size={20} className="text-bm-red mb-3" />
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-bm-silver leading-relaxed">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
