"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, Cpu, Fingerprint, MessageSquare, Receipt } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const ICONS = [ClipboardCheck, Fingerprint, MessageSquare, Receipt, Cpu] as const;
const labels = {
  pl: { badge: "Prawdziwy warsztat • Warszawa Włochy", gallery: "Poznaj nasz warsztat", photo: "Hala i stanowiska serwisowe BESS MOTORS w Warszawie" },
  ru: { badge: "Реальный автосервис • Варшава Włochy", gallery: "Посмотреть наш сервис", photo: "Сервисная зона BESS MOTORS в Варшаве" },
  uk: { badge: "Справжній автосервіс • Варшава Włochy", gallery: "Подивитися наш сервіс", photo: "Сервісна зона BESS MOTORS у Варшаві" },
  en: { badge: "Real workshop • Warsaw Włochy", gallery: "Explore our workshop", photo: "BESS MOTORS workshop bays in Warsaw" },
} as const;

export function WhyBessMotors() {
  const { t, locale } = useI18n();
  const w = t.whyBess;
  const ui = labels[locale];
  return (
    <section className="border-t border-white/10 bg-[#0c1016] py-14 sm:py-20" aria-labelledby="why-bess-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-12">
          <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/15 bg-[#151922] sm:min-h-[470px]">
            <Image src="/images/workshop/workshop-hall.png" alt={ui.photo} fill quality={75} loading="lazy" sizes="(min-width: 1024px) 43vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090e]/90 via-[#07090e]/15 to-transparent" aria-hidden />
            <div className="absolute bottom-5 left-5 right-5">
              <span className="inline-flex rounded-lg border border-white/25 bg-black/70 px-3 py-2 text-xs font-bold text-white/85 backdrop-blur-sm">{ui.badge}</span>
              <Link href="/gallery?tab=workshop" className="mt-3 flex min-h-11 w-fit items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#13151b] transition-colors hover:bg-white/85">{ui.gallery}<ArrowUpRight size={17} aria-hidden /></Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.20em] text-bm-accent">BESS MOTORS / NASZ SERWIS</p>
            <h2 id="why-bess-heading" className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{w.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bm-label sm:text-base">{w.subtitle}</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {w.items.map((item, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <li key={item.title} className="bm-premium-card flex items-start gap-3 rounded-2xl border border-white/10 bg-[#1b2029] p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bm-red/10 text-bm-accent"><Icon size={19} aria-hidden /></span>
                    <div>
                      <h3 className="text-sm font-bold leading-snug text-white">{item.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-bm-label">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
