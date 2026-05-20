"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { serviceCategories } from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ServicesPage() {
  const { t } = useI18n();
  const [problem, setProblem] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase text-glow">
            {t.services.title}
          </h1>
          <p className="mt-4 text-bm-muted text-lg max-w-2xl">{t.services.subtitle}</p>
          <div className="mt-4 h-1 w-24 bg-bm-red shadow-neon-sm" />
        </motion.div>

        <section className="mt-16">
          <h2 className="font-display text-xl uppercase tracking-wide mb-8 text-bm-red">
            {t.services.categories}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {serviceCategories.map((cat, i) => {
              const Icon =
              (Icons as unknown as Record<string, typeof Icons.Wrench>)[cat.icon] ?? Icons.Wrench;
              const label = t.serviceItems[cat.id as keyof typeof t.serviceItems];
              return (
                <Card key={cat.id} delay={i * 0.03} glow className="group cursor-pointer">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl metallic text-bm-red mb-4 group-hover:shadow-neon transition-shadow">
                    <Icon size={28} />
                  </div>
                  <h3 className="font-display font-semibold uppercase text-sm">{label}</h3>
                  <p className="mt-2 text-xs text-bm-muted">Premium service</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-20">
          <Card glow className="max-w-2xl mx-auto">
            <h2 className="font-display text-xl uppercase text-bm-red mb-6">
              {t.services.customRequest}
            </h2>
            {submitted ? (
              <p className="text-center text-bm-red font-semibold py-8">✓ Request submitted!</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-4"
              >
                <textarea
                  className="input-premium min-h-[120px] resize-y"
                  placeholder={t.services.describeProblem}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  required
                />
                <div className="flex flex-wrap gap-4">
                  <label className="btn-outline cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" />
                    {t.services.attachPhoto}
                  </label>
                  <label className="btn-outline cursor-pointer">
                    <input type="file" accept="video/*" className="hidden" />
                    {t.services.attachVideo}
                  </label>
                </div>
                <Button type="submit" className="w-full">
                  {t.services.submit}
                </Button>
              </form>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
