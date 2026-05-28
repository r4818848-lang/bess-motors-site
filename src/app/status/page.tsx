"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/Card";
import { TelegramOpenButton } from "@/components/shared/TelegramOpenButton";
import { WaitTimeEstimator } from "@/components/booking/WaitTimeEstimator";

type StatusResult = {
  number: string;
  statusLabel: string;
  progressPercent: number;
  needsSign: boolean;
  vehicle: { make: string; model: string; plate: string };
  queuePosition?: number | null;
  queueTotal?: number | null;
  clientPartsStatusLabel?: string | null;
};

export default function StatusPage() {
  const { locale } = useI18n();
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<StatusResult | null>(null);

  const labels =
    locale === "ru" || locale === "uk"
      ? {
          title: "Статус ремонта",
          phone: "Телефон",
          plate: "Госномер",
          check: "Проверить",
          notFound: "Не найдено. Проверьте телефон и госномер.",
          sign: "Требуется подпись документа",
          cabinet: "Полный кабинет",
          queue: (p: number, t: number) => `В очереди: примерно ${p} из ${t}`,
          parts: "Запчасти",
        }
      : locale === "en"
        ? {
            title: "Repair status",
            phone: "Phone",
            plate: "License plate",
            check: "Check",
            notFound: "Not found. Check phone and plate.",
            sign: "Signature required",
            cabinet: "Full account",
            queue: (p: number, t: number) => `Queue: about ${p} of ${t}`,
            parts: "Parts",
          }
        : {
            title: "Status naprawy",
            phone: "Telefon",
            plate: "Tablica rejestracyjna",
            check: "Sprawdź",
            notFound: "Nie znaleziono. Sprawdź telefon i tablicę.",
            sign: "Wymagany podpis dokumentu",
            cabinet: "Pełne konto",
            queue: (p: number, t: number) => `Kolejka: ok. ${p} z ${t}`,
            parts: "Części",
          };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const q = new URLSearchParams({ phone, plate, locale });
      const res = await fetch(`/api/status?${q}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(labels.notFound);
        return;
      }
      setResult(data as StatusResult);
    } catch {
      setError(labels.notFound);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="mx-auto max-w-md px-4">
        <h1 className="font-display text-3xl font-bold uppercase text-center mb-8">
          {labels.title}
        </h1>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">
              <span className="text-bm-muted">{labels.phone}</span>
              <input
                className="input mt-1 w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-bm-muted">{labels.plate}</span>
              <input
                className="input mt-1 w-full uppercase"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                required
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "…" : labels.check}
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
              {result.needsSign && (
                <p className="text-sm text-amber-400">{labels.sign}</p>
              )}
              {result.clientPartsStatusLabel && (
                <p className="text-sm text-blue-400">
                  {labels.parts}: {result.clientPartsStatusLabel}
                </p>
              )}
              {result.queuePosition != null &&
                result.queueTotal != null &&
                result.queueTotal > 1 && (
                <p className="text-sm text-bm-muted">
                  {labels.queue(result.queuePosition, result.queueTotal)}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <TelegramOpenButton startParam="link" />
                <Link href="/cabinet" className="btn-outline text-sm inline-block">
                  {labels.cabinet}
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
