"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { insuranceClaimChecklist, checklistLabel } from "@/lib/insurance-checklist";
import { Card } from "@/components/ui/Card";

const STORAGE_KEY = "bess-insurance-checklist";

export function InsuranceClaimChecklist() {
  const { locale, t } = useI18n();
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <Card className="p-5 mb-6">
      <p className="font-display uppercase text-sm mb-4">{t.insuranceClaim.title}</p>
      <ul className="space-y-2">
        {insuranceClaimChecklist.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="flex items-start gap-3 w-full text-left text-sm hover:text-white"
              onClick={() => toggle(item.id)}
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  checked[item.id] ? "bg-bm-red border-bm-red" : "border-bm-border"
                }`}
              >
                {checked[item.id] ? <Check size={12} /> : null}
              </span>
              {checklistLabel(item, locale)}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
