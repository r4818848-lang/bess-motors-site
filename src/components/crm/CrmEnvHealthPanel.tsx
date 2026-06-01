"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/Card";

type EnvCheck = { id: string; ok: boolean; hint: string };

export function CrmEnvHealthPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const [checks, setChecks] = useState<EnvCheck[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = (await res.json()) as { checks?: EnvCheck[] };
        if (!cancelled) setChecks(data.checks ?? []);
      } catch {
        if (!cancelled) setChecks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-4 mb-6 border-bm-border">
        <p className="text-sm text-bm-muted">{c.envHealthLoading}</p>
      </Card>
    );
  }

  const allOk = checks?.every((x) => x.ok) ?? false;

  return (
    <Card className={`p-4 mb-6 ${allOk ? "border-green-500/40" : "border-amber-500/40"}`}>
      <h3 className="font-display text-sm uppercase text-bm-red font-bold mb-3">
        {c.envHealthTitle}
      </h3>
      <p className="text-xs text-bm-muted mb-4">{c.envHealthHint}</p>
      <ul className="space-y-2 text-sm">
        {(checks ?? []).map((ch) => (
          <li key={ch.id} className="flex flex-wrap gap-2 items-start">
            <span className={ch.ok ? "text-green-500" : "text-amber-400"}>
              {ch.ok ? "✓" : "○"}
            </span>
            <span className="font-mono text-xs text-bm-silver">{ch.hint}</span>
          </li>
        ))}
      </ul>
      {!allOk && (
        <p className="text-xs text-amber-400 mt-4">{c.envHealthFix}</p>
      )}
    </Card>
  );
}
