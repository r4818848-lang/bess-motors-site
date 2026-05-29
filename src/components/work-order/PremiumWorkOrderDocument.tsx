"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { Phone, Globe, MapPin, ShieldCheck, Cog, UserCheck, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, Vehicle, User } from "@/lib/store";
import { siteConfig } from "@/lib/site";
import {
  calcOrderBreakdown,
  calcServiceLine,
  calcPartLine,
} from "@/lib/workorder-calc";
import type { DocLocale, WorkOrderDocVariant } from "@/lib/work-order-document";
import { getWorkOrderLegalTexts, workOrderLegalLocaleFromUi } from "@/lib/work-order-share";
import { resolveOrderDocumentLocale } from "@/lib/work-order-locale";
import {
  getFormDocLabels,
  getFormFooterContent,
  padFormRows,
  formatDocDate,
} from "@/lib/work-order-form-labels";

export type PremiumWorkOrderMode = "screen" | "print";

interface Props {
  order: WorkOrder;
  vehicle: Vehicle;
  client: User;
  vatRate?: number;
  mode?: PremiumWorkOrderMode;
  variant?: WorkOrderDocVariant;
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

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="wo-form-field">
      <span className="wo-form-field-label">{label}</span>
      <span className="wo-form-field-value">{value || "\u00A0"}</span>
    </div>
  );
}

const footerIcons = [ShieldCheck, Cog, UserCheck, Clock];

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
  const docLocale = docLocaleProp ?? workOrderLegalLocaleFromUi(locale);
  const L = getFormDocLabels(docLocale);
  const footer = getFormFooterContent(docLocale);
  const legal = getWorkOrderLegalTexts(docLocale);
  const b = calcOrderBreakdown(order, vatRate);
  const isBw = variant === "bw";
  const rootClass = isBw ? "wo-form-root wo-form-bw" : "wo-form-root wo-form-color";

  const completionDate =
    order.estimatedReadyAt?.slice(0, 10) ??
    (order.status === "ready" || order.status === "delivered" ? order.updatedAt : "");

  const serviceLines = padFormRows(
    order.services.map((s, i) => ({
      key: s.id,
      num: i + 1,
      name: s.name,
      total: calcServiceLine(s),
    })),
    8
  );

  const partLines = padFormRows(
    order.parts.map((p) => ({
      key: p.id,
      name: p.name,
      qty: p.qty,
      total: calcPartLine(p),
    })),
    8
  );

  const notesText = order.clientNotes || "";

  return (
    <div id={id} className={`${rootClass} ${className}`}>
      {(repairStatusLabel || documentStatusLabel || clientPaymentLabel || toolbar) && (
        <div className="wo-form-screen-bar print:hidden">
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

      {/* Header */}
      <header className="wo-form-header">
        <div className="wo-form-header-top">
          <div className="wo-form-logo">
            <Image
              src={siteConfig.logoImage}
              alt={siteConfig.name}
              width={200}
              height={60}
              className="h-14 w-auto object-contain"
              unoptimized
              priority
            />
          </div>
          <div className="wo-form-title-block">
            <h1 className="wo-form-title">
              {L.titleNo} <span className="wo-form-title-num">{order.number}</span>
            </h1>
          </div>
          <div className="wo-form-contact">
            <p>
              <Phone className="inline w-3.5 h-3.5 mr-1 text-[#c00000]" />
              {siteConfig.phone}
            </p>
            <p>
              <Globe className="inline w-3.5 h-3.5 mr-1 text-[#c00000]" />
              {L.website}
            </p>
            <p>
              <MapPin className="inline w-3.5 h-3.5 mr-1 text-[#c00000]" />
              {siteConfig.address}
            </p>
          </div>
        </div>

        <div className="wo-form-dates">
          <div className="wo-form-date-field">
            <span>{L.receptionDate}</span>
            <span className="wo-form-date-line">{formatDocDate(order.createdAt)}</span>
          </div>
          <div className="wo-form-date-field">
            <span>{L.completionDate}</span>
            <span className="wo-form-date-line">{formatDocDate(completionDate)}</span>
          </div>
        </div>
      </header>

      {/* Vehicle + Client */}
      <div className="wo-form-info-grid">
        <section>
          <h2 className="wo-form-section-title">{L.vehicleData}</h2>
          <FieldRow
            label={L.makeModel}
            value={`${vehicle.make} ${vehicle.model}`.trim()}
          />
          <FieldRow label={L.year} value={vehicle.year ? String(vehicle.year) : "—"} />
          <FieldRow label={L.plate} value={vehicle.plate} />
          <FieldRow label={L.vin} value={vehicle.vin || "—"} />
          <FieldRow
            label={L.mileage}
            value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "—"}
          />
        </section>
        <section>
          <h2 className="wo-form-section-title">{L.clientData}</h2>
          <FieldRow label={L.fullName} value={client.name} />
          <FieldRow label={L.phone} value={client.phone} />
          <FieldRow label={L.email} value={client.email || siteConfig.email} />
        </section>
      </div>

      {/* Works + Parts tables side by side */}
      <div className="wo-form-tables-grid">
        <section>
          <h2 className="wo-form-section-title">{L.workList}</h2>
          <table className="wo-form-table">
            <thead>
              <tr>
                <th className="w-10">{L.numberCol}</th>
                <th>{L.workName}</th>
                <th className="w-24 text-right">{L.cost}</th>
              </tr>
            </thead>
            <tbody>
              {serviceLines.map((row, i) => (
                <tr key={row.key ?? `empty-s-${i}`}>
                  <td className="text-center text-gray-500">{row.num ?? i + 1}</td>
                  <td>{row.name ?? ""}</td>
                  <td className="text-right font-mono">
                    {row.total != null && row.total > 0 ? row.total.toFixed(2) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="wo-form-section-title">{L.partsMaterials}</h2>
          <table className="wo-form-table">
            <thead>
              <tr>
                <th>{L.partName}</th>
                <th className="w-14 text-center">{L.qty}</th>
                <th className="w-24 text-right">{L.cost}</th>
              </tr>
            </thead>
            <tbody>
              {partLines.map((row, i) => (
                <tr key={row.key ?? `empty-p-${i}`}>
                  <td>{row.name || ""}</td>
                  <td className="text-center">{row.qty ?? ""}</td>
                  <td className="text-right font-mono">
                    {row.total != null && row.total > 0 ? row.total.toFixed(2) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Comments + Totals */}
      <div className="wo-form-bottom-grid">
        <section>
          <h2 className="wo-form-section-title">{L.additionalInfo}</h2>
          <div className="wo-form-notes">
            {notesText && <p>{notesText}</p>}
            {mode === "screen" && !notesText && (
              <p className="text-[10px] text-gray-500 leading-relaxed">{legal.confirmation}</p>
            )}
          </div>
        </section>

        <section>
          <table className="wo-form-totals">
            <tbody>
              <tr>
                <td>{L.worksCost}</td>
                <td className="font-mono text-right">{b.servicesSub.toFixed(2)}</td>
              </tr>
              <tr>
                <td>{L.partsCost}</td>
                <td className="font-mono text-right">{b.partsSub.toFixed(2)}</td>
              </tr>
              {b.discount > 0 && (
                <tr>
                  <td>{L.orderDiscount}</td>
                  <td className="font-mono text-right text-[#c00000]">
                    -{b.discount.toFixed(2)}
                  </td>
                </tr>
              )}
              {order.vatEnabled && b.vatAmount > 0 && (
                <tr>
                  <td>
                    {L.vat} ({b.vatRate}%)
                  </td>
                  <td className="font-mono text-right">{b.vatAmount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="wo-form-total-row">
                <td>{L.totalToPay}</td>
                <td className="font-mono text-right font-bold">
                  {b.grossTotal.toFixed(2)} {L.currency}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* Signatures */}
      <div className="wo-form-signatures">
        <div className="wo-form-sign-block">
          <p className="wo-form-sign-role">{L.executor}</p>
          <div className="wo-form-sign-line" />
          <div className="wo-form-sign-labels">
            <span>{L.signLabel}</span>
            <span>{L.dateLabel}</span>
          </div>
        </div>
        <div className="wo-form-sign-block">
          <p className="wo-form-sign-role">{L.clientSign}</p>
          {order.signature?.dataUrl && !signatureSlot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.signature.dataUrl}
              alt=""
              className="h-12 object-contain my-1"
            />
          ) : signatureSlot ? (
            signatureSlot
          ) : (
            <div className="wo-form-sign-line" />
          )}
          <div className="wo-form-sign-labels">
            <span>{L.signLabel}</span>
            <span>
              {L.dateLabel}
              {order.signature
                ? `: ${new Date(order.signature.signedAt).toLocaleDateString()}`
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Footer benefits */}
      <footer className="wo-form-footer">
        <div className="wo-form-benefits">
          {footer.benefits.map((item, i) => {
            const Icon = footerIcons[i] ?? ShieldCheck;
            return (
              <div key={item.title} className="wo-form-benefit">
                <div className="wo-form-benefit-icon">
                  <Icon className="w-5 h-5" />
                </div>
                <p>
                  <strong>{item.title}</strong>
                  <br />
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
        <p className="wo-form-slogan">
          <span className="text-[#c00000] font-bold">BESS MOTORS</span>
          <span className="text-gray-800"> — {footer.slogan.replace(/^BESS MOTORS — /, "")}</span>
        </p>
      </footer>

      {footerActions && <div className="wo-form-actions print:hidden">{footerActions}</div>}
    </div>
  );
}
