"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, Phone, FileSearch } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { SITE_NAP } from "@/lib/site-nap";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";

export function Hero() {
  const { t } = useI18n();
  const h = t.hero;

  return (
    <section className="relative min-h-[auto] sm:min-h-[68vh] flex items-end sm:items-center overflow-hidden pt-2 sm:pt-4 pb-6 sm:pb-10">
      <div className="absolute inset-0 z-0" aria-hidden>
        <Image
          src={siteConfig.bannerImage}
          alt="BESS MOTORS — serwis samochodowy Warszawa Włochy, Aleja Krakowska"
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
              "linear-gradient(105deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.86) 42%, rgba(10,10,10,0.4) 70%, rgba(0,0,0,0.25) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bm-black via-transparent to-bm-black/50" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 w-full py-8 sm:py-14">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-xs sm:text-sm font-semibold text-bm-silver/90 mb-3">
              {SITE_NAP.addressLine} · {SITE_NAP.workingHoursLabel}
            </p>

            <h1 className="font-display font-black uppercase leading-[1.05] tracking-tight text-2xl sm:text-4xl md:text-5xl text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
              {h.h1}
            </h1>

            <p className="mt-4 text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed">
              {h.subtitle}
            </p>

            <p className="mt-3 text-sm font-semibold text-bm-red">{h.highlight}</p>

            <PhoneLink
              trackSource="hero_phone"
              className="mt-5 inline-block font-display text-2xl sm:text-3xl font-black text-white hover:text-bm-red transition-colors tracking-wide"
            >
              {SITE_NAP.phoneDisplay}
            </PhoneLink>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <a href="#wyceń-po-vin" className="btn-primary inline-flex items-center justify-center gap-2 min-h-[44px]">
                <FileSearch size={18} />
                {h.ctaVin}
              </a>
              <BookingLink
                trackSource="hero"
                className="btn-outline inline-flex items-center justify-center gap-2 min-h-[44px]"
              >
                {h.ctaBook}
                <ChevronRight size={16} />
              </BookingLink>
              <PhoneLink
                trackSource="hero_cta"
                className="btn-outline inline-flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Phone size={16} />
                {h.ctaCall}
              </PhoneLink>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
