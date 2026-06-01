"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { fillTemplate } from "@/lib/i18n/locale-utils";
import { Card } from "@/components/ui/Card";
import { TelegramOpenButton } from "@/components/shared/TelegramOpenButton";
import { WaitTimeEstimator } from "@/components/booking/WaitTimeEstimator";

type StatusResult = {
  orderId?: string;
  number: string;
  statusLabel: string;
  progressPercent: number;
  needsSign: boolean;
  paymentStatus?: "unpaid" | "paid";
  vehicle: { make: string; model: string; plate: string };
  queuePosition?: number | null;
  queueTotal?: number | null;
  clientPartsStatusLabel?: string | null;
};

export default function StatusPage() {
  const { t, locale } = useI18n();
  const s = t.statusPage;
  const ps = t.paymentStatus;
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<StatusResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const q = new URLSearchParams({ phone, plate, locale });
      const res = await fetch(`/api/status?${q}`);
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        if (data.error === "unavailable" || res.status === 503) {
          setError(s.unavailable);
        } else if (data.error === "rate_limit" || res.status === 429) {
          setError(s.rateLimit);
        } else if (data.error === "no_active") {
          setError(s.noActive);
        } else {
          setError(s.notFound);
        }
        return;
      }
      setResult(data as StatusResult);
    } catch {
      setError(s.notFound);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="mx-auto max-w-md px-4">
        <h1 className="font-display text-3xl font-bold uppercase text-center mb-8">
          {s.title}
        </h1>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">
              <span className="text-bm-muted">{s.phone}</span>
              <input
                className="input mt-1 w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-bm-muted">{s.plate}</span>
              <input
                className="input mt-1 w-full uppercase"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                required
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "…" : s.check}
            </button>
          </form>
          {error && <p className="text-bm-red text-sm mt-4">{error}</p>}
          {result && (
            <div className="mt-6 space-y-3 border-t border-bm-border pt-6">
              <p className="font-mono text-bm-red font-bold">{result.number}</p>
              <p>
                {result.vehicle.make} {result.vehicle.model} · {result.vehicle.plate}
              </p>
              <p className="text-lg font-semibold">{result.statusLabel}</p>
              <div className="h-2 bg-bm-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-bm-red transition-all"
                  style={{ width: `${result.progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-bm-muted">{result.progressPercent}%</p>
              {result.paymentStatus && (
                <p className="text-sm text-bm-silver">
                  {result.paymentStatus === "paid" ? ps.paid : ps.unpaid}
                </p>
              )}
              {result.needsSign && result.orderId && (
                <Link
                  href={`/sign/${result.orderId}`}
                  className="btn-primary text-sm inline-block mt-2"
                >
                  {t.activeRepair.signDocument}
                </Link>
              )}
              {result.needsSign && !result.orderId && (
                <p className="text-sm text-amber-400">{s.sign}</p>
              )}
              {result.clientPartsStatusLabel && (
                <p className="text-sm text-blue-400">
                  {s.parts}: {result.clientPartsStatusLabel}
                </p>
              )}
              {result.queuePosition != null &&
                result.queueTotal != null &&
                result.queueTotal > 1 && (
                <p className="text-sm text-bm-muted">
                  {fillTemplate(s.queue, {
                    position: result.queuePosition,
                    total: result.queueTotal,
                  })}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <TelegramOpenButton startParam="link" />
                <Link href="/cabinet" className="btn-outline text-sm inline-block">
                  {s.cabinet}
                </Link>
              </div>
            </div>
          )}
        </Card>
        <div className="mt-8 max-w-md mx-auto">
          <WaitTimeEstimator />
        </div>
      </div>
    </div>
  );
}
