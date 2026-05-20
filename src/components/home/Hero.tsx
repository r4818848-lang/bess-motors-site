"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, Phone, Timer, Shield, Tag, ShieldCheck } from "lucide-react";
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
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Banner reference — desktop right */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[55%] opacity-30 lg:opacity-100 pointer-events-none">
        <div className="relative h-full w-full">
          <Image
            src={siteConfig.bannerImage}
            alt="BESS MOTORS"
            fill
            className="object-cover object-right-top"
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bm-black via-bm-black/80 to-transparent lg:via-bm-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-bm-black via-transparent to-bm-black/50" />
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
            className="mb-8 lg:hidden"
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

            {/* Value pills — like banner ribbon */}
            <div className="mt-6 inline-flex flex-wrap gap-0 rounded-lg overflow-hidden border border-bm-red/40 shadow-neon-sm">
              {pills.map(({ icon: Icon, label }, i) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-4 py-2.5 bg-bm-red/90 text-white text-xs font-bold uppercase tracking-wide ${
                    i > 0 ? "border-l border-bm-red/50" : ""
                  }`}
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
              <Link href="/crm" className="btn-outline group border-bm-muted/40 text-bm-muted hover:text-bm-red">
                <ShieldCheck className="w-4 h-4" />
                {t.hero.ctaAdmin}
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
