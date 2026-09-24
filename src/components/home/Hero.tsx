"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { Logo } from "@/components/brand/Logo";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-[72dvh] sm:min-h-[78vh] flex items-center overflow-hidden pt-4 sm:pt-6">
      <div className="absolute inset-0 z-0" aria-hidden>
        <Image
          src={siteConfig.bannerImage}
          alt="BESS MOTORS — serwis samochodowy Warszawa Włochy"
          fill
          priority
          className="object-cover object-[72%_42%] sm:object-[75%_40%] scale-105"
          sizes="100vw"
          quality={85}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 38%, rgba(10,10,10,0.45) 62%, rgba(0,0,0,0.2) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bm-black via-transparent to-bm-black/55" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 20% 60%, rgba(225,6,0,0.28), transparent 70%)",
          }}
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden>
        <div className="absolute left-0 right-0 top-28 h-px bg-gradient-to-r from-transparent via-bm-red/55 to-transparent animate-scan-line" />
        <motion.div
          className="absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-bm-red/20 blur-3xl"
          animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 w-full py-12 sm:py-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-7"
          >
            <Logo size="lg" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08 }}
          >
            <p className="font-display text-xs uppercase tracking-[0.28em] text-bm-red mb-4 drop-shadow-lg">
              {t.tagline}
            </p>

            <h1 className="font-display font-black uppercase leading-[0.92] tracking-tight">
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white italic sm:-skew-x-6 drop-shadow-[0_4px_28px_rgba(0,0,0,0.85)]">
                {t.hero.slogan1}
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-bm-red text-glow italic sm:-skew-x-6 mt-1.5">
                {t.hero.slogan2}
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/90 font-semibold tracking-wide drop-shadow-md max-w-xl">
              {t.hero.subtitle}
            </p>

            <div className="mt-9 flex flex-wrap gap-3 sm:gap-4">
              <PhoneLink trackSource="hero_cta" className="btn-primary group">
                <Phone className="w-4 h-4" />
                {t.hero.ctaCall}
              </PhoneLink>
              <BookingLink trackSource="hero" className="btn-outline group">
                {t.hero.ctaBook}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </BookingLink>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              <PhoneLink
                trackSource="hero_phone"
                className="mt-9 inline-block font-display text-2xl sm:text-3xl md:text-4xl font-black text-white hover:text-bm-red transition-colors tracking-wide drop-shadow-lg break-all sm:break-normal"
              >
                {siteConfig.phone}
              </PhoneLink>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
