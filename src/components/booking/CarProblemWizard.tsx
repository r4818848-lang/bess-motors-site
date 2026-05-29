"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { pickName } from "@/lib/i18n/locale-utils";
import {
  resolveWizardItemIds,
  wizardPrimaryCategory,
  type WizardSymptomId,
} from "@/lib/car-problem-wizard";
import { getPriceItem } from "@/lib/price-list";
import { buildCartLine } from "@/lib/booking-cart";
import type { CartLine } from "@/lib/booking-cart";
import type { PriceCategoryId } from "@/lib/price-list";

type Props = {
  onApply: (lines: CartLine[], category: PriceCategoryId) => void;
};

export function CarProblemWizard({ onApply }: Props) {
  const { t, locale } = useI18n();
  const w = t.carWizard;
  const [selected, setSelected] = useState<WizardSymptomId[]>([]);

  const toggle = (id: WizardSymptomId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const apply = () => {
    const ids = resolveWizardItemIds(selected);
    const lines: CartLine[] = [];
    for (const id of ids) {
      const item = getPriceItem(id);
      if (!item) continue;
      const label = pickName(item, locale);
      lines.push(buildCartLine(item, label, 1));
    }
    if (lines.length) {
      onApply(lines, wizardPrimaryCategory(selected));
    }
  };

  const symptoms: { id: WizardSymptomId; label: string }[] = [
    { id: "check_engine", label: w.checkEngine },
    { id: "noise_suspension", label: w.noiseSuspension },
    { id: "brakes_weak", label: w.brakesWeak },
    { id: "ac_weak", label: w.acWeak },
    { id: "oil_service", label: w.oilService },
    { id: "tires", label: w.tires },
    { id: "chip_power", label: w.chipPower },
    { id: "electrical", label: w.electrical },
  ];

  return (
    <div className="rounded-2xl border border-bm-border/60 bg-bm-card/50 p-5 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="text-bm-red" size={20} />
        <h2 className="font-display text-sm uppercase text-bm-red">{w.title}</h2>
      </div>
      <p className="text-sm text-bm-muted mb-4">{w.subtitle}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {symptoms.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
              selected.includes(s.id)
                ? "bg-bm-red/20 border-bm-red text-bm-red"
                : "border-bm-border text-bm-muted hover:border-bm-red/40"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!selected.length}
        onClick={apply}
        className="btn-primary text-xs disabled:opacity-40"
      >
        {w.apply}
      </button>
    </div>
  );
}
