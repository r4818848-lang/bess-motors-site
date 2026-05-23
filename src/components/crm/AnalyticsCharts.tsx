"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import type { CrmAnalytics } from "@/lib/crm-analytics";

interface Props {
  stats: CrmAnalytics;
}

export function AnalyticsCharts({ stats }: Props) {
  const { t } = useI18n();
  const rx = t.reportsExt;

  const maxRev = Math.max(...stats.revenueByMonth.map((m) => m.revenue), 1);
  const maxSvc = Math.max(...stats.topServices.map((s) => s.amount), 1);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-red rounded-xl p-6 neon-border">
        <h4 className="font-display text-xs uppercase text-bm-red mb-6 tracking-widest">
          {rx.revenueByMonth}
        </h4>
        <div className="flex items-end gap-1.5 h-48">
          {stats.revenueByMonth.map((m, i) => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <motion.div
                className="w-full rounded-t bg-gradient-to-t from-bm-red/80 to-bm-red/30"
                initial={{ height: 0 }}
                whileInView={{ height: `${(m.revenue / maxRev) * 100}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.45 }}
                style={{ minHeight: m.revenue > 0 ? 4 : 0 }}
                title={`${m.revenue.toFixed(0)} zł`}
              />
              <span className="text-[8px] text-bm-muted truncate w-full text-center">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-red rounded-xl p-6 neon-border">
        <h4 className="font-display text-xs uppercase text-bm-red mb-6 tracking-widest">
          {rx.topServices}
        </h4>
        <div className="space-y-4">
          {stats.topServices.length === 0 ? (
            <p className="text-sm text-bm-muted text-center py-8">—</p>
          ) : (
            stats.topServices.map((item, i) => {
              const pct = Math.round((item.amount / maxSvc) * 100);
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1 gap-2">
                    <span className="truncate">{item.name}</span>
                    <span className="text-bm-red font-mono shrink-0">
                      {item.amount.toFixed(0)} zł
                    </span>
                  </div>
                  <div className="h-2 bg-bm-border rounded overflow-hidden">
                    <motion.div
                      className="h-full bg-bm-red shadow-neon-sm"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
