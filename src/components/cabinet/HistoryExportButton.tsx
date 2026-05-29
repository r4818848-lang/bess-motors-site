"use client";



import { useI18n } from "@/lib/i18n/context";

import { contentLocale } from "@/lib/i18n/locale-utils";

import type { Database, User, WorkOrder } from "@/lib/store";

import { calcClientTotal } from "@/lib/workorder-calc";

import { downloadWorkOrderPdf } from "@/lib/work-order-pdf";



export function HistoryExportButton({

  user,

  db,

  orders,

}: {

  user: User;

  db: Database;

  orders: WorkOrder[];

}) {

  const { locale, t } = useI18n();

  const latest = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!latest) return null;



  const vehicle = db.vehicles.find((v) => v.id === latest.vehicleId);

  const vehicleLabel = vehicle

    ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`

    : latest.number;



  return (

    <button

      type="button"

      className="btn-outline text-sm mb-6"

      onClick={() =>

        downloadWorkOrderPdf(latest, vehicleLabel, contentLocale(locale))

      }

    >

      {t.historyExport.downloadLatest} ({latest.number}, {calcClientTotal(latest).toFixed(0)} zł)

    </button>

  );

}


