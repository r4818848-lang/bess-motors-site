"use client";

import { Users, Package, ShieldCheck, Cpu, Timer } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/Card";

const icons = [Users, Package, ShieldCheck, Cpu, Timer];

export function Advantages() {
  const { t } = useI18n();

  return (
    <section className="py-24 bg-bm-graphite/20 border-y border-bm-red/20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-center mb-12">
          {t.sections.advantages}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {t.advantages.map((item, i) => {
            const Icon = icons[i] ?? ShieldCheck;
            return (
              <Card key={i} delay={i * 0.08} glow className="text-center py-6">
                <Icon className="w-8 h-8 text-bm-red mx-auto mb-3" />
                <h3 className="font-display text-xs font-bold uppercase mb-2 leading-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-bm-muted">{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
