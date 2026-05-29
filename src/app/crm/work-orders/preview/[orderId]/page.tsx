"use client";

import { use, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Printer, Palette, Contrast, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { WorkOrderPrintView } from "@/components/work-order/WorkOrderPrintView";
import { DocumentLocalePicker } from "@/components/work-order/DocumentLocalePicker";
import {
  resolveOrderDocumentLocale,
  type DocLocale,
} from "@/lib/work-order-locale";
import type { WorkOrderDocVariant } from "@/lib/work-order-document";
import { buildWorkOrderPreviewUrl } from "@/lib/work-order-preview";

export default function WorkOrderPreviewPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-gray-600">…</p>
        </div>
      }
    >
      <WorkOrderPreviewContent params={params} />
    </Suspense>
  );
}

function WorkOrderPreviewContent({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const d = t.document;

  const urlLang = searchParams.get("lang");
  const urlVariant = searchParams.get("variant");

  const db = loadDb();
  const order = db.workOrders.find((o) => o.id === orderId);
  const vehicle = order ? db.vehicles.find((v) => v.id === order.vehicleId) : undefined;
  const client = order ? db.users.find((u) => u.id === order.userId) : undefined;
  const vatRate = db.settings.vatRate ?? 23;

  const initialLang = useMemo((): DocLocale => {
    if (urlLang === "pl" || urlLang === "ru" || urlLang === "en") return urlLang;
    return order ? resolveOrderDocumentLocale(order, locale) : "pl";
  }, [urlLang, order, locale]);

  const [docLang, setDocLang] = useState<DocLocale>(initialLang);
  const [variant, setVariant] = useState<WorkOrderDocVariant>(
    urlVariant === "bw" ? "bw" : "color"
  );

  const handlePrint = () => {
    window.print();
  };

  if (!order || !vehicle || !client) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-gray-700">{t.document.orderNotFound}</p>
        <Link
          href="/crm/work-orders"
          className="text-sm text-[#c00000] hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> CRM
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white">
      <div className="sticky top-0 z-20 print:hidden bg-[#1a1a1a] border-b border-white/10 shadow-lg">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/crm/work-orders?edit=${encodeURIComponent(orderId)}`}
              className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 shrink-0"
            >
              <ArrowLeft size={14} />
              {order.number}
            </Link>
            <span className="text-xs text-gray-500 hidden sm:inline">·</span>
            <span className="text-xs text-gray-400 truncate">{d.preview}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DocumentLocalePicker
              value={docLang}
              onChange={(loc) => {
                setDocLang(loc);
                window.history.replaceState(
                  null,
                  "",
                  buildWorkOrderPreviewUrl(orderId, { lang: loc, variant })
                );
              }}
              compact
            />
            <button
              type="button"
              className={`wo-doc-icon-btn ${variant === "color" ? "wo-doc-icon-btn-active" : ""}`}
              onClick={() => {
                setVariant("color");
                window.history.replaceState(
                  null,
                  "",
                  buildWorkOrderPreviewUrl(orderId, { lang: docLang, variant: "color" })
                );
              }}
              title={d.printColor}
            >
              <Palette size={16} />
            </button>
            <button
              type="button"
              className={`wo-doc-icon-btn ${variant === "bw" ? "wo-doc-icon-btn-active" : ""}`}
              onClick={() => {
                setVariant("bw");
                window.history.replaceState(
                  null,
                  "",
                  buildWorkOrderPreviewUrl(orderId, { lang: docLang, variant: "bw" })
                );
              }}
              title={d.printBw}
            >
              <Contrast size={16} />
            </button>
            <button
              type="button"
              className="wo-doc-icon-btn"
              onClick={handlePrint}
              title={d.printColor}
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>

      <WorkOrderPrintView
        order={order}
        vehicle={vehicle}
        client={client}
        vatRate={vatRate}
        variant={variant}
        docLocale={docLang}
      />
    </div>
  );
}
