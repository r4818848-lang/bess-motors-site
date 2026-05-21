"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, Phone, Timer, Shield, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { Logo } from "@/components/brand/Logo";

export function Hero() {
  const { t } = useI18n();

  const pills = [
    { icon: Timer, label: t.hero.pillFast },
    { icon: Shield, label: t.hero.pillPro },
    { icon: Tag, label: t.hero.pillPrices },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-bm-black" />
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Фон справа — ровный блок с авто, без дубля баннера */}
      <div
        className="absolute inset-y-0 right-0 hidden md:block w-[min(50%,560px)] pointer-events-none"
        aria-hidden
      >
        <div className="relative h-full w-full">
          <Image
            src={siteConfig.heroCarImage}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="560px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bm-black via-bm-black/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bm-black via-transparent to-bm-black/40" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-bm-red/40 to-transparent" />
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-bm-red/50 to-transparent animate-scan-line" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 w-full py-12">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Logo size="lg" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-display text-xs uppercase tracking-[0.25em] text-bm-red mb-3">
              {t.tagline}
            </p>

            <h1 className="font-display font-black uppercase leading-[0.95] tracking-tight">
              <span className="block text-4xl md:text-5xl lg:text-6xl text-white italic -skew-x-6">
                {t.hero.slogan1}
              </span>
              <span className="block text-4xl md:text-5xl lg:text-6xl text-bm-red text-glow italic -skew-x-6 mt-1">
                {t.hero.slogan2}
              </span>
            </h1>

            <p className="mt-6 text-bm-muted leading-relaxed max-w-lg">{t.hero.desc}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {pills.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-bm-red/70 bg-bm-red/90 text-white text-xs font-bold uppercase tracking-wide shadow-[0_0_14px_rgba(225,6,0,0.35)]"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a href={siteConfig.phoneHref} className="btn-primary group">
                <Phone className="w-4 h-4" />
                {t.hero.ctaCall}
              </a>
              <Link href="/booking" className="btn-outline group">
                {t.hero.ctaBook}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/cabinet" className="btn-outline group">
                {t.nav.cabinet}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <a
              href={siteConfig.phoneHref}
              className="mt-8 inline-block font-display text-3xl md:text-4xl font-black text-white hover:text-bm-red transition-colors tracking-wide"
            >
              {siteConfig.phone}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
