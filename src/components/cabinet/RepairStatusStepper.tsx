"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { RepairStatus } from "@/lib/store";

const flow: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

interface Props {
  status: RepairStatus;
}

export function RepairStatusStepper({ status }: Props) {
  const { t } = useI18n();
  const rs = t.repairStatus;
  const currentIdx = flow.indexOf(status);

  return (
    <div className="glass-red rounded-xl p-4 neon-border mb-6">
      <p className="text-[10px] uppercase tracking-widest text-bm-red mb-4">
        {t.cabinet.repairProgress}
      </p>
      <div className="flex flex-wrap gap-2">
        {flow.map((st, i) => {
          const done = i <= currentIdx;
          const active = st === status;
          return (
            <div
              key={st}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] uppercase font-semibold border ${
                active
                  ? "bg-bm-red/25 border-bm-red text-white"
                  : done
                    ? "border-green-500/40 text-green-400"
                    : "border-bm-border text-bm-muted"
              }`}
            >
              {done && !active && <Check className="w-3 h-3" />}
              <span className="leading-tight">{rs[st]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
