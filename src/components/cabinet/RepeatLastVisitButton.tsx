"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder } from "@/lib/store";

export function RepeatLastVisitButton({ orders }: { orders: WorkOrder[] }) {
  const { locale } = useI18n();
  const last = [...orders]
    .filter((o) => o.status === "delivered")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (!last?.services.length) return null;

  const services = last.services.map((s) => s.name).join(", ");
  const comment = encodeURIComponent(
    locale === "ru" || locale === "uk"
      ? `Повтор: ${services}`
      : locale === "pl"
        ? `Powtórz: ${services}`
        : `Repeat: ${services}`
  );

  const label =
    locale === "ru"
      ? "Повторить прошлый визит"
      : locale === "pl"
        ? "Powtórz ostatnią wizytę"
        : "Repeat last visit";

  return (
    <Link
      href={`/booking?comment=${comment}`}
      className="btn-outline text-sm inline-flex items-center gap-2 mb-6"
    >
      <RotateCcw size={16} />
      {label}
    </Link>
  );
}
