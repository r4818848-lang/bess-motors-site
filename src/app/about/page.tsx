"use client";

import { motion } from "framer-motion";
import { Gauge, Users, Award, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/Card";
import { WorkshopGallerySection } from "@/components/home/WorkshopGallerySection";

export default function AboutPage() {
  const { t } = useI18n();

  const icons = [Gauge, Users, Award, Zap];
  const values = t.aboutFeatures.map((v, i) => ({ ...v, icon: icons[i] ?? Gauge }));

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase text-glow">
            {t.about.title}
          </h1>
          <p className="mt-4 text-xl text-bm-red font-display uppercase tracking-wide">
            {t.about.subtitle}
          </p>
        </motion.div>

        <div className="mt-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-video rounded-2xl metallic neon-border overflow-hidden">
            <div className="absolute inset-0 bg-radial-glow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-6xl font-black text-bm-red/30">BM</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 glass rounded-lg p-4">
              <p className="font-mono text-xs text-bm-red">SYSTEM ONLINE</p>
              <p className="text-sm text-bm-muted">Premium Automotive OS v2.0</p>
            </div>
          </div>
          <div>
            <p className="text-lg text-bm-muted leading-relaxed">
              {t.about.mission} {t.hero.slogan1} {t.hero.slogan2}
            </p>
            <p className="mt-4 text-bm-red font-display font-bold uppercase">
              {t.hero.pillFast} · {t.hero.pillPro} · {t.hero.pillPrices}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {values.map((v, i) => {
                const Icon = v.icon;
                return (
                  <Card key={i} delay={i * 0.1}>
                    <Icon className="w-8 h-8 text-bm-red mb-3" />
                    <h3 className="font-display text-sm font-bold uppercase">{v.title}</h3>
                    <p className="text-xs text-bm-muted mt-1">{v.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
        <WorkshopGallerySection />
      </div>
    </div>
  );
}
