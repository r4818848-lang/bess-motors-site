"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, Phone, Timer, Shield, Tag, Snowflake } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { AcBookCtaButton } from "@/components/booking/AcBookingChoiceFlow";
import { AcPromoPriceBadges } from "@/components/home/AcPromoPriceBadges";
import { Logo } from "@/components/brand/Logo";

export function Hero() {
  const { t } = useI18n();

  const pills = [
    { icon: Timer, label: t.hero.pillFast },
    { icon: Shield, label: t.hero.pillPro },
    { icon: Tag, label: t.hero.pillPrices },
  ];

  return (
    <section className="relative min-h-[88dvh] sm:min-h-[85vh] flex items-center overflow-hidden pt-20">
      {/* Фон: полный баннер на всю секцию */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <Image
          src={siteConfig.bannerImage}
          alt="BESS MOTORS — serwis klimatyzacji i mechanika Warszawa"
          fill
          priority
          className="object-cover object-[72%_42%] sm:object-[75%_40%]"
          sizes="100vw"
          quality={85}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.25) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bm-black via-transparent to-bm-black/50" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute left-0 right-0 top-24 h-px bg-gradient-to-r from-transparent via-bm-red/50 to-transparent animate-scan-line" />
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
            <p className="font-display text-xs uppercase tracking-[0.25em] text-bm-red mb-3 drop-shadow-lg">
              {t.tagline}
            </p>

            <h1 className="font-display font-black uppercase leading-[0.95] tracking-tight overflow-hidden">
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white italic sm:-skew-x-6 drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">
                {t.hero.slogan1}
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-bm-red text-glow italic sm:-skew-x-6 mt-1">
                {t.hero.slogan2}
              </span>
            </h1>

            <p className="mt-6 text-bm-silver/95 leading-relaxed max-w-lg drop-shadow-md">
              {t.hero.desc}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-6 rounded-2xl border-2 border-bm-red/90 bg-gradient-to-br from-bm-red/35 via-bm-black/70 to-bm-red/20 p-4 sm:p-5 shadow-[0_0_32px_rgba(225,6,0,0.35)] backdrop-blur-sm"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-bm-red/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  <Snowflake size={11} />
                  {t.seasonalAc.badge}
                </span>
                <AcPromoPriceBadges variant="hero" className="mb-0" />
              </div>
              <p className="font-display text-lg sm:text-xl font-bold uppercase text-white leading-tight">
                {t.seasonalAc.title}
              </p>
              <p className="mt-2 text-xs sm:text-sm text-bm-silver/95 leading-relaxed max-w-xl">
                {t.seasonalAc.subtitle}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <AcBookCtaButton
                  trackSource="hero_ac_promo"
                  className="btn-primary text-xs sm:text-sm inline-flex items-center gap-1.5"
                >
                  {t.seasonalAc.ctaBook}
                  <ChevronRight size={14} />
                </AcBookCtaButton>
                <Link href="/klimatyzacja" className="btn-outline text-xs sm:text-sm">
                  {t.seasonalAc.ctaLearn}
                </Link>
              </div>
            </motion.div>

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
              <PhoneLink trackSource="hero_cta" className="btn-primary group">
                <Phone className="w-4 h-4" />
                {t.hero.ctaCall}
              </PhoneLink>
              <BookingLink trackSource="hero" className="btn-outline group">
                {t.hero.ctaBook}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </BookingLink>
              <Link href="/cabinet" className="btn-outline group">
                {t.nav.cabinet}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <PhoneLink
              trackSource="hero_phone"
              className="mt-8 inline-block font-display text-2xl sm:text-3xl md:text-4xl font-black text-white hover:text-bm-red transition-colors tracking-wide drop-shadow-lg break-all sm:break-normal"
            >
              {siteConfig.phone}
            </PhoneLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
