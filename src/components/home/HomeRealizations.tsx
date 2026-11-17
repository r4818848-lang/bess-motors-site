"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Camera, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { documentLocale } from "@/lib/i18n/locale-utils";
import { WORK_BEFORE_AFTER_CASES } from "@/lib/work-before-after";
import { OurWorksSection } from "@/components/gallery/OurWorksSection";

const c = {
  pl: { eyebrow: "Prawdziwe realizacje BESS MOTORS", before: "PRZED", after: "PO", view: "Zobacz cały przypadek", videos: "Zobacz także nasze filmy z napraw", note: "Zdjęcia z rzeczywistych prac; ujęcia przed i po nie muszą być wykonane pod identycznym kątem." },
  ru: { eyebrow: "Реальные работы BESS MOTORS", before: "ДО", after: "ПОСЛЕ", view: "Все фотографии работы", videos: "Видео наших ремонтов", note: "Реальные фотографии работ. Ракурсы до и после могут отличаться." },
  uk: { eyebrow: "Реальні роботи BESS MOTORS", before: "ДО", after: "ПІСЛЯ", view: "Усі фото ремонту", videos: "Відео наших ремонтів", note: "Реальні фотографії робіт. Ракурси до і після можуть відрізнятися." },
  en: { eyebrow: "Real BESS MOTORS work", before: "BEFORE", after: "AFTER", view: "View complete case", videos: "Videos of our repairs", note: "Real repair photos. Before and after shots may use different camera angles." },
} as const;

/** Prominent real before/after cases; the full portfolio remains on /gallery. */
export function HomeRealizations() {
  const { t, locale } = useI18n();
  const ow = t.ourWorks;
  const lang = documentLocale(locale);
  const copy = c[locale];
  const featured = WORK_BEFORE_AFTER_CASES.filter((item) => item.before.length && item.after.length).slice(0, 2);

  return (
    <section className="border-t border-white/10 bg-gradient-to-b from-[#141821] to-[#0d1016] py-14 sm:py-20" aria-labelledby="realizations-heading" data-testid="home-case-studies">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.19em] text-[#ff7772]">{copy.eyebrow}</p>
            <h2 id="realizations-heading" className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{ow.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">{ow.subtitle}</p>
          </div>
          <Link href="/gallery?tab=repairs" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-bold text-white transition-colors hover:border-bm-red hover:bg-white/5">
            <Camera size={17} aria-hidden />{ow.viewAllWorks}<ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {featured.map((item) => (
            <article key={item.id} className="bm-premium-card overflow-hidden rounded-[26px] border border-white/15 bg-[#1b2029]" data-testid="work-case-card">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ff7772]">{item.make || "BESS MOTORS"}</p>
                  <h3 className="mt-1 text-base font-bold leading-snug text-white">{item.job[lang]}</h3>
                </div>
                <CheckCircle2 className="h-6 w-6 shrink-0 text-[#ff7772]" aria-hidden />
              </div>
              <div className="grid grid-cols-2 gap-1 bg-[#0e1116]">
                {([
                  { src: item.before[0], label: copy.before },
                  { src: item.after[0], label: copy.after },
                ] as const).map((photo) => (
                  <div key={photo.label} className="relative aspect-[4/4.5] overflow-hidden sm:aspect-[4/3]">
                    <Image src={photo.src} alt={item.job[lang] + " — " + photo.label} fill quality={75} sizes="(max-width: 1024px) 50vw, 300px" className="object-cover" loading="lazy" />
                    <span className="absolute left-3 top-3 rounded-md border border-white/20 bg-black/70 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.12em] text-white">{photo.label}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4">
                <Link href="/gallery?tab=repairs" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-white hover:text-[#ff7772]">{copy.view}<ArrowUpRight size={17} aria-hidden /></Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/45">{copy.note}</p>

        <div className="mt-12 border-t border-white/10 pt-8">
          <h3 className="mb-6 text-lg font-bold text-white">{copy.videos}</h3>
          <OurWorksSection showHeader={false} limit={3} />
        </div>
      </div>
    </section>
  );
}
