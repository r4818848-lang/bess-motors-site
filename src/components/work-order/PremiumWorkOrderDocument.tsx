"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, Vehicle, User } from "@/lib/store";
import { siteConfig } from "@/lib/site";
import {
  calcOrderBreakdown,
  calcServiceLine,
  calcPartLine,
} from "@/lib/workorder-calc";
import {
  getDocLabels,
  type DocLocale,
  type WorkOrderDocVariant,
} from "@/lib/work-order-document";
import {
  getWorkOrderLegalTexts,
  workOrderLegalLocaleFromUi,
} from "@/lib/work-order-share";
import { getPremiumWoContent } from "@/lib/work-order-locale";
import { WorkOrderPhotoGallery } from "./WorkOrderPhotoGallery";

export type PremiumWorkOrderMode = "screen" | "print";

interface Props {
  order: WorkOrder;
  vehicle: Vehicle;
  client: User;
  vatRate?: number;
  mode?: PremiumWorkOrderMode;
  variant?: WorkOrderDocVariant;
  /** Override document language (print / client sign) */
  docLocale?: DocLocale;
  className?: string;
  id?: string;
  repairStatusLabel?: string;
  documentStatusLabel?: string;
  clientPaymentLabel?: string | null;
  toolbar?: ReactNode;
  signatureSlot?: ReactNode;
  footerActions?: ReactNode;
}

function PremiumTable({
  title,
  accent,
  headers,
  rows,
}: {
  title: string;
  accent: "red" | "dark";
  headers: string[];
  rows: ReactNode[][];
}) {
  const headBg =
    accent === "red"
      ? "from-[#e10600] via-[#c00500] to-[#1a1a1a]"
      : "from-[#1a1a1a] via-[#2a2a2a] to-[#0a0a0a]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-3"
    >
      <p className="wo-premium-section-title">{title}</p>
      <div className="wo-premium-table-wrap overflow-x-auto">
        <table className="wo-premium-table min-w-[520px]">
          <thead>
            <tr className={`bg-gradient-to-r ${headBg}`}>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="text-center text-bm-muted py-8">
                  —
                </td>
              </tr>
            ) : (
              rows.map((cells, i) => (
                <tr key={i}>
                  {cells.map((cell, j) => (
                    <td
                      key={j}
                      className={
                        j === cells.length - 1
                          ? "text-bm-red font-mono font-semibold text-right"
                          : j === 0
                            ? "text-white font-medium"
                            : ""
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export function PremiumWorkOrderDocument({
  order,
  vehicle,
  client,
  vatRate = 23,
  mode = "screen",
  variant = "color",
  docLocale: docLocaleProp,
  className = "",
  id,
  repairStatusLabel,
  documentStatusLabel,
  clientPaymentLabel,
  toolbar,
  signatureSlot,
  footerActions,
}: Props) {
  const { locale, t } = useI18n();
  const docLocale: DocLocale =
    docLocaleProp ?? workOrderLegalLocaleFromUi(locale);
  const L = getDocLabels(docLocale);
  const legal = getWorkOrderLegalTexts(docLocale);
  const premium = getPremiumWoContent(docLocale);
  const b = calcOrderBreakdown(order, vatRate);
  const sig = t.signature;
  const clientFiles = order.files.filter((f) => f.category !== "internal");
  const isPrint = mode === "print";
  const MotionWrap = isPrint ? "div" : motion.div;

  const serviceRows = order.services.map((s) => [
    s.name || "—",
    String(s.qty),
    `${s.price.toFixed(2)} ${L.currency}`,
    s.discount > 0 ? `-${s.discount}%` : "—",
    `${calcServiceLine(s).toFixed(2)} ${L.currency}`,
  ]);

  const partRows = order.parts.map((pt) => [
    pt.name || "—",
    String(pt.qty),
    `${pt.sellPrice.toFixed(2)} ${L.currency}`,
    pt.discount > 0 ? `-${pt.discount}%` : "—",
    `${calcPartLine(pt).toFixed(2)} ${L.currency}`,
  ]);

  const badges = [
    premium.badges[0],
    premium.badges[1],
    premium.badges[2],
    premium.badges[3],
  ];

  const printClass = mode === "print" ? "print:shadow-none" : "";
  const variantClass =
    variant === "bw" ? "wo-premium-bw" : "wo-premium-color wo-forged-carbon";

  return (
    <div
      id={id}
      className={`wo-premium-root ${variantClass} ${printClass} ${className}`}
    >
      <div className="wo-premium-accent-bar" aria-hidden />
      <header className="wo-premium-header">
        <div className="wo-premium-scan top-12" />
        <div className="absolute inset-0 wo-glow-br pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-[0.12] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <MotionWrap
            {...(isPrint ? {} : { initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.6 } })}
            className="flex flex-col items-start"
          >
            <div className="relative mb-5">
              <div className="absolute -inset-6 bg-bm-red/20 blur-3xl rounded-full" />
              <Image
                src={siteConfig.logoImage}
                alt={siteConfig.name}
                width={260}
                height={78}
                className="relative h-[4.25rem] sm:h-[5rem] w-auto object-contain wo-premium-logo-glow"
                unoptimized
                priority
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-bm-red/90 font-display">
              {L.title}
            </p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-bm-muted/90 mt-1">
              {L.subtitle}
            </p>
            <div className="wo-premium-number-frame mt-4">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-wider">
                <span className="text-bm-red">{order.number}</span>
              </span>
            </div>
            <p className="text-xs text-bm-muted mt-3 font-display uppercase tracking-widest">
              {L.date} · {order.createdAt}
            </p>
          </MotionWrap>

          <MotionWrap
            {...(isPrint ? {} : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.6, delay: 0.1 } })}
            className="lg:text-right w-full lg:max-w-2xl"
          >
            <h2 className="wo-premium-slogan text-xl sm:text-2xl md:text-3xl lg:text-[2rem] xl:text-[2.25rem]">
              {premium.slogan}
            </h2>
            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3 lg:justify-end">
              {badges.map((label) => (
                <span key={label} className="wo-premium-badge-outline">
                  {label}
                </span>
              ))}
            </div>
          </MotionWrap>
        </div>
        <div className="relative z-10 h-px mt-10 bg-gradient-to-r from-transparent via-bm-red/70 to-transparent" />
      </header>

      <div className="wo-premium-body">
        {(repairStatusLabel || documentStatusLabel || clientPaymentLabel || toolbar) && (
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              {repairStatusLabel && (
                <span className="status-pill bg-bm-red/20 text-bm-red text-[10px]">
                  {repairStatusLabel}
                </span>
              )}
              {documentStatusLabel && (
                <span className="status-pill doc-status-progress text-[10px]">
                  {documentStatusLabel}
                </span>
              )}
              {clientPaymentLabel && (
                <span className="status-pill bg-green-500/20 text-green-400 text-[10px]">
                  {t.cabinet.paymentLabel}: {clientPaymentLabel}
                </span>
              )}
            </div>
            {toolbar}
          </div>
        )}

        {/* Client + vehicle */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="wo-premium-card"
          >
            <p className="wo-premium-section-title mb-5">{L.client}</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-bm-border/40 pb-2">
                <span className="text-bm-muted uppercase text-[10px]">{L.client}</span>
                <span className="font-semibold text-white text-right">{client.name}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-bm-border/40 pb-2">
                <span className="text-bm-muted uppercase text-[10px]">{L.phone}</span>
                <span className="font-mono text-bm-silver">{client.phone}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-bm-border/40 pb-2">
                <span className="text-bm-muted uppercase text-[10px]">{L.date}</span>
                <span className="text-bm-silver">{order.createdAt}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-bm-muted uppercase text-[10px]">№</span>
                <span className="font-mono text-bm-red font-bold">{order.number}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="wo-premium-card"
          >
            <p className="wo-premium-section-title mb-5 text-bm-silver">{L.vehicle}</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-bm-border/40 pb-2">
                <span className="text-bm-muted uppercase text-[10px]">
                  {vehicle.make} / {vehicle.model}
                </span>
                <span className="font-semibold text-white text-right">
                  {vehicle.year || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-bm-border/40 pb-2">
                <span className="text-bm-muted uppercase text-[10px]">{L.vin}</span>
                <span className="font-mono text-xs text-bm-silver break-all text-right">
                  {vehicle.vin || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-bm-border/40 pb-2">
                <span className="text-bm-muted uppercase text-[10px]">{L.plate}</span>
                <span className="font-mono text-bm-red font-bold">{vehicle.plate}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-bm-muted uppercase text-[10px]">{L.mileage}</span>
                <span className="text-bm-silver">
                  {vehicle.mileage.toLocaleString()} km
                </span>
              </div>
              {vehicle.engine && (
                <p className="text-xs text-bm-muted pt-1">{vehicle.engine}</p>
              )}
            </div>
          </motion.div>
        </div>

        {order.clientNotes && (
          <p className="text-sm text-bm-silver/90 border border-bm-red/30 bg-bm-red/[0.04] rounded-xl pl-5 pr-4 py-4 italic">
            {order.clientNotes}
          </p>
        )}

        <PremiumTable
          title={L.works}
          accent="red"
          headers={[L.works, L.qty, L.price, L.discount, L.total]}
          rows={serviceRows}
        />

        {(order.parts.length > 0 || mode === "screen") && (
          <PremiumTable
            title={L.parts}
            accent="dark"
            headers={[L.parts, L.qty, L.price, L.discount, L.total]}
            rows={partRows}
          />
        )}

        <WorkOrderPhotoGallery files={clientFiles} />

        {/* Totals + signature row */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="wo-premium-card space-y-4"
          >
            <p className="wo-premium-section-title mb-4">
              <Shield className="w-4 h-4 shrink-0" />
              {sig.title}
            </p>
            <p className="text-xs text-bm-muted leading-relaxed">{legal.confirmation}</p>
            <p className="text-xs text-bm-muted leading-relaxed mt-3 pt-3 border-t border-bm-border/40">
              {legal.vehiclePickup}
            </p>
            {order.signature ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                {order.signature.dataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={order.signature.dataUrl}
                    alt="signature"
                    className="h-16 object-contain mb-3"
                  />
                )}
                <p className="text-[10px] text-emerald-400">{sig.confirmed}</p>
                <p className="text-[10px] text-bm-muted mt-2">
                  {sig.signedAt}:{" "}
                  {new Date(order.signature.signedAt).toLocaleString()}
                </p>
                <p className="text-[10px] text-bm-muted">{order.signature.signedBy}</p>
              </div>
            ) : signatureSlot ? (
              signatureSlot
            ) : (
              <div className="h-24 rounded-xl border-2 border-dashed border-bm-border/60 flex items-center justify-center text-bm-muted text-xs">
                {L.signature}: ___________________
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="wo-premium-total space-y-3"
          >
            <div className="flex justify-between text-sm text-bm-muted">
              <span>{t.wo.worksTotal}</span>
              <span className="font-mono">{b.servicesSub.toFixed(2)} {L.currency}</span>
            </div>
            <div className="flex justify-between text-sm text-bm-muted">
              <span>{t.wo.partsTotal}</span>
              <span className="font-mono">{b.partsSub.toFixed(2)} {L.currency}</span>
            </div>
            {b.discount > 0 && (
              <div className="flex justify-between text-sm text-bm-red">
                <span>{L.orderDiscount}</span>
                <span className="font-mono">-{b.discount.toFixed(2)} {L.currency}</span>
              </div>
            )}
            {order.vatEnabled && b.vatAmount > 0 && (
              <div className="flex justify-between text-sm text-bm-muted">
                <span>
                  {L.vat} ({b.vatRate}%)
                </span>
                <span className="font-mono">{b.vatAmount.toFixed(2)} {L.currency}</span>
              </div>
            )}
            <div className="h-px bg-gradient-to-r from-transparent via-bm-red to-transparent my-4" />
            <div className="flex flex-wrap justify-between items-end gap-4 relative z-[1]">
              <span className="font-display text-xs uppercase tracking-[0.25em] text-bm-silver">
                {L.gross}
              </span>
              <span className="wo-premium-total-amount text-4xl sm:text-5xl lg:text-6xl">
                {b.grossTotal.toFixed(2)}
                <span className="text-xl sm:text-2xl ml-1 text-bm-red/90">{L.currency}</span>
              </span>
            </div>
          </motion.div>
        </div>

        {footerActions && (
          <div className="pt-4 border-t border-bm-border/50">{footerActions}</div>
        )}

        <p className="text-[9px] text-center text-bm-muted/80 pb-2 wo-premium-footer-line">
          {siteConfig.name} · {siteConfig.address} · {siteConfig.phone} · {siteConfig.email}
        </p>
      </div>
    </div>
  );
}
