"use client";

import { useMemo } from "react";
import { FileText, Wrench, Package, Download, PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { pdfLocale as getPdfLocale } from "@/lib/i18n/locale-utils";
import type { Database, WorkOrder } from "@/lib/store";
import { calcClientTotal, calcOrderBreakdown } from "@/lib/workorder-calc";
import {
  generateWorkOrderPdfColor,
  generateWorkOrderPdfBw,
} from "@/lib/pdf";
import { Button } from "@/components/ui/Button";
import { orderNeedsClientSignature } from "@/lib/order-signature";

interface Props {
  db: Database;
  userId: string;
  /** When set, only show these orders (e.g. after status filter) */
  orderIds?: string[];
  onOpenOrder: (orderId: string) => void;
}

function docStatusClass(status?: string) {
  switch (status) {
    case "awaiting_signature":
      return "doc-status-awaiting";
    case "signed":
      return "doc-status-signed";
    case "in_progress":
      return "doc-status-progress";
    case "completed":
      return "doc-status-completed";
    case "delivered":
      return "doc-status-delivered";
    default:
      return "doc-status-progress";
  }
}

export function ServiceHistoryTimeline({ db, userId, orderIds, onOpenOrder }: Props) {
  const { t, locale } = useI18n();
  const h = t.history;
  const vatRate = db.settings.vatRate ?? 23;
  const pdfLoc = getPdfLocale(locale);

  const orders = useMemo(() => {
    const idSet = orderIds ? new Set(orderIds) : null;
    return db.workOrders
      .filter((o) => o.userId === userId && (!idSet || idSet.has(o.id)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db.workOrders, userId, orderIds]);

  const stats = useMemo(() => {
    const total = orders.reduce((s, o) => s + calcClientTotal(o), 0);
    const byVehicle = new Map<string, { count: number; total: number }>();
    orders.forEach((o) => {
      const cur = byVehicle.get(o.vehicleId) ?? { count: 0, total: 0 };
      byVehicle.set(o.vehicleId, {
        count: cur.count + 1,
        total: cur.total + calcClientTotal(o),
      });
    });
    return { total, repairs: orders.length, byVehicle };
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="glass-red rounded-xl p-12 text-center text-bm-muted neon-border">
        {h.empty}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-red rounded-xl p-5 neon-border text-center">
          <p className="text-[10px] uppercase text-bm-muted tracking-widest">{h.totalSpent}</p>
          <p className="font-display text-3xl font-bold text-bm-red text-glow mt-1">
            {stats.total.toFixed(0)} zł
          </p>
        </div>
        <div className="glass-red rounded-xl p-5 neon-border text-center">
          <p className="text-[10px] uppercase text-bm-muted tracking-widest">{h.repairCount}</p>
          <p className="font-display text-3xl font-bold mt-1">{stats.repairs}</p>
        </div>
        <div className="glass-red rounded-xl p-5 neon-border">
          <p className="text-[10px] uppercase text-bm-muted tracking-widest mb-2">{h.byVehicle}</p>
          <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
            {[...stats.byVehicle.entries()].map(([vid, s]) => {
              const v = db.vehicles.find((x) => x.id === vid);
              return (
                <li key={vid} className="flex justify-between">
                  <span>{v ? `${v.make} ${v.model}` : "—"}</span>
                  <span className="text-bm-red font-mono">{s.total.toFixed(0)} zł</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="relative space-y-0">
        {orders.map((order, i) => (
          <TimelineEntry
            key={order.id}
            order={order}
            db={db}
            isLast={i === orders.length - 1}
            vatRate={vatRate}
            pdfLocale={pdfLoc}
            onOpen={() => onOpenOrder(order.id)}
            docClass={docStatusClass(order.documentStatus)}
            labels={{ ...h, signNow: t.signature.signNow }}
            docLabels={t.documentStatus}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineEntry({
  order,
  db,
  isLast,
  vatRate,
  pdfLocale,
  onOpen,
  docClass,
  labels,
  docLabels,
}: {
  order: WorkOrder;
  db: Database;
  isLast: boolean;
  vatRate: number;
  pdfLocale: "pl" | "ru" | "en";
  onOpen: () => void;
  docClass: string;
  labels: {
    works: string;
    parts: string;
    photos: string;
    viewOrder: string;
    downloadPdf: string;
    signNow: string;
  };
  docLabels: Record<string, string>;
}) {
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const client = db.users.find((u) => u.id === order.userId);
  const total = calcOrderBreakdown(order, vatRate).grossTotal;
  const photos = (order.files ?? []).filter(
    (f) => f.type === "image" && f.dataUrl && f.category !== "internal"
  );

  const dateLabel = new Date(order.createdAt).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="relative pl-10 pb-10">
      {!isLast && <div className="service-timeline-line" />}
      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-bm-red shadow-neon-sm flex items-center justify-center z-10">
        <Wrench size={12} className="text-white" />
      </div>

      <div className="glass-red rounded-xl p-5 neon-border hover:border-bm-red/50 transition-all">
        <div className="flex flex-wrap justify-between gap-3 mb-4">
          <div>
            <p className="font-display text-lg font-bold text-bm-red">{dateLabel}</p>
            <p className="text-xs text-bm-muted font-mono">{order.number}</p>
            {vehicle && (
              <p className="text-sm mt-1">
                {vehicle.make} {vehicle.model} · {vehicle.plate}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-glow">{total.toFixed(2)} zł</p>
            <span className={`status-pill text-[10px] mt-2 ${docClass}`}>
              {docLabels[order.documentStatus ?? "in_progress"]}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {order.services.length > 0 && (
            <div>
              <p className="text-[10px] uppercase text-bm-red mb-2 flex items-center gap-1">
                <Wrench size={12} /> {labels.works}
              </p>
              <ul className="space-y-1 text-bm-muted">
                {order.services.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-bm-red" />
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {order.parts.length > 0 && (
            <div>
              <p className="text-[10px] uppercase text-bm-muted mb-2 flex items-center gap-1">
                <Package size={12} /> {labels.parts}
              </p>
              <ul className="space-y-1 text-bm-muted">
                {order.parts.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-bm-border" />
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {photos.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase text-bm-muted mb-2">{labels.photos}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.slice(0, 4).map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.id}
                  src={f.dataUrl}
                  alt={f.name}
                  className="w-20 h-14 rounded object-cover border border-bm-border shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-bm-border/50">
          <Button className="text-xs" onClick={onOpen}>
            <FileText size={14} /> {labels.viewOrder}
          </Button>
          {orderNeedsClientSignature(order) && (
            <Button variant="outline" className="text-xs" onClick={onOpen}>
              <PenLine size={14} /> {labels.signNow}
            </Button>
          )}
          {vehicle && client && (
            <>
              <Button
                variant="outline"
                className="text-xs"
                onClick={() =>
                  generateWorkOrderPdfColor(order, vehicle, client, pdfLocale, vatRate)
                }
              >
                <Download size={14} /> {labels.downloadPdf}
              </Button>
              <Button
                variant="outline"
                className="text-xs"
                onClick={() =>
                  generateWorkOrderPdfBw(order, vehicle, client, pdfLocale, vatRate)
                }
              >
                <Download size={14} /> PDF B/W
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
