"use client";

import Link from "next/link";
import { Car } from "lucide-react";
import { useAuth } from "@/lib/auth/session-context";
import { loadDb } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";

export function HomeGarageTeaser() {
  const { isClientLoggedIn, clientUser } = useAuth();
  const { t } = useI18n();

  if (!isClientLoggedIn || !clientUser) return null;

  const vehicles = loadDb().vehicles.filter((v) => v.userId === clientUser.id).slice(0, 3);
  if (!vehicles.length) return null;

  return (
    <section className="py-12 border-y border-bm-border/30">
      <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Car className="text-bm-red" />
          <h2 className="font-display text-xl uppercase">{t.cabinet.garageTitle}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {vehicles.map((v) => (
            <span
              key={v.id}
              className="px-3 py-2 rounded-lg border border-bm-border/50 text-sm"
            >
              {v.plate} · {v.make} {v.model}
            </span>
          ))}
        </div>
        <Link href="/cabinet" className="btn-outline text-xs">
          {t.nav.cabinet}
        </Link>
      </div>
    </section>
  );
}
