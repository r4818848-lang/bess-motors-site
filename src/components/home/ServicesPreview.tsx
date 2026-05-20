"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { serviceCategories } from "@/lib/data";
import { Card } from "@/components/ui/Card";

export function ServicesPreview() {
  const { t } = useI18n();
  const preview = serviceCategories.slice(0, 8);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide">
              {t.sections.popularServices}
            </h2>
            <div className="mt-2 h-1 w-20 bg-bm-red shadow-neon-sm" />
          </div>
          <Link href="/services" className="text-bm-red hover:underline text-sm font-semibold uppercase">
            {t.sections.viewAll} →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {preview.map((cat, i) => {
            const Icon =
              (Icons as unknown as Record<string, typeof Icons.Wrench>)[cat.icon] ?? Icons.Wrench;
            const label = t.serviceItems[cat.id as keyof typeof t.serviceItems];
            return (
              <Card key={cat.id} delay={i * 0.05} glow>
                <Link href="/services" className="block">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bm-red/20 text-bm-red mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-semibold text-sm">{label}</h3>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
