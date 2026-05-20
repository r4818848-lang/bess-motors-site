"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

const barData = [65, 82, 45, 90, 72, 88, 55, 95, 70, 85, 60, 78];

export function AnalyticsCharts() {
  const { t } = useI18n();
  const { charts } = t;
  const max = Math.max(...barData);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-red rounded-xl p-6 neon-border">
        <h4 className="font-display text-xs uppercase text-bm-red mb-6 tracking-widest">
          {charts.revenueByMonth}
        </h4>
        <div className="flex items-end gap-2 h-48">
          {barData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-t bg-gradient-to-t from-bm-red/80 to-bm-red/30"
                initial={{ height: 0 }}
                whileInView={{ height: `${(v / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                style={{ minHeight: 4 }}
              />
              <span className="text-[9px] text-bm-muted">{charts.months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-red rounded-xl p-6 neon-border">
        <h4 className="font-display text-xs uppercase text-bm-red mb-6 tracking-widest">
          {charts.topServices}
        </h4>
        <div className="space-y-4">
          {charts.services.map((item, i) => (
            <div key={item.name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.name}</span>
                <span className="text-bm-red">{item.pct}%</span>
              </div>
              <div className="h-2 bg-bm-border rounded overflow-hidden">
                <motion.div
                  className="h-full bg-bm-red shadow-neon-sm"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
