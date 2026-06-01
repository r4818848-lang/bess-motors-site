"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  Printer,
  FileDown,
  MessageCircle,
  Send,
  Eye,
  Palette,
  Contrast,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, Vehicle, User } from "@/lib/store";
import { loadDb } from "@/lib/store";
import {
  generateWorkOrderPdfColor,
  generateWorkOrderPdfBw,
} from "@/lib/pdf";
import type { WorkOrderDocVariant } from "@/lib/work-order-document";
import {
  resolveOrderDocumentLocale,
  type DocLocale,
} from "@/lib/work-order-locale";
import { WorkOrderPrintView } from "./WorkOrderPrintView";
import { DocumentLocalePicker } from "./DocumentLocalePicker";
import { buildShareMessage, telegramShareUrl } from "@/lib/work-order-share";
import { whatsappToClientUrl } from "@/lib/whatsapp-messages";
import { SignLinkShareBlock } from "./SignLinkShareBlock";
import { openWorkOrderPreview } from "@/lib/work-order-preview";

interface Props {
  order: WorkOrder;
  client: User;
  vehicle: Vehicle | undefined;
  compact?: boolean;
  iconToolbar?: boolean;
  onDocumentLocaleChange?: (locale: DocLocale) => void;
}

function WoDocIconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="wo-doc-icon-btn"
    >
      {children}
    </button>
  );
}

export function WorkOrderDocumentActions({
  order,
  client,
  vehicle,
  compact,
  iconToolbar,
  onDocumentLocaleChange,
}: Props) {
  const { t, locale } = useI18n();
  const d = t.document;
  const [showPrint, setShowPrint] = useState(false);
  const [printVariant, setPrintVariant] = useState<WorkOrderDocVariant>("color");
  const [pdfLoading, setPdfLoading] = useState<"color" | "bw" | null>(null);
  const db = loadDb();
  const vatRate = db.settings.vatRate ?? 23;
  const docLang = resolveOrderDocumentLocale(order, locale);
  const shareText = useMemo(
    () => buildShareMessage(order, client, docLang),
    [order, client, docLang]
  );
  const clientWhatsAppHref = useMemo(
    () => whatsappToClientUrl(client.phone, shareText),
    [client.phone, shareText]
  );

  const setDocLang = (loc: DocLocale) => onDocumentLocaleChange?.(loc);

  const handlePrint = (variant: WorkOrderDocVariant) => {
    setPrintVariant(variant);
    setShowPrint(true);
    requestAnimationFrame(() => {
      window.print();
      setTimeout(() => setShowPrint(false), 500);
    });
  };

  if (!vehicle) return null;

  const iconSize = 18;

  const localePicker = (
    <DocumentLocalePicker
      value={docLang}
      onChange={setDocLang}
      compact={iconToolbar}
    />
  );

  const docIcons = (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {localePicker}
      <WoDocIconButton
        title={d.preview}
        onClick={() => openWorkOrderPreview(order.id, { lang: docLang, variant: "color" })}
      >
        <Eye size={iconSize} />
      </WoDocIconButton>
      <WoDocIconButton title={d.printColor} onClick={() => handlePrint("color")}>
        <Palette size={iconSize} />
      </WoDocIconButton>
      <WoDocIconButton title={d.printBw} onClick={() => handlePrint("bw")}>
        <Printer size={iconSize} />
      </WoDocIconButton>
      <WoDocIconButton
        title={d.downloadPdfColor}
        disabled={pdfLoading !== null}
        onClick={async () => {
          setPdfLoading("color");
          try {
            await generateWorkOrderPdfColor(order, vehicle, client, docLang, vatRate);
          } finally {
            setPdfLoading(null);
          }
        }}
      >
        <FileDown size={iconSize} className="text-bm-red" />
      </WoDocIconButton>
      <WoDocIconButton
        title={d.downloadPdfBw}
        disabled={pdfLoading !== null}
        onClick={async () => {
          setPdfLoading("bw");
          try {
            await generateWorkOrderPdfBw(order, vehicle, client, docLang, vatRate);
          } finally {
            setPdfLoading(null);
          }
        }}
      >
        <Contrast size={iconSize} />
      </WoDocIconButton>
    </div>
  );

  if (iconToolbar) {
    return (
      <>
        {docIcons}
        {showPrint && (
          <PrintOverlay
            printVariant={printVariant}
            order={order}
            vehicle={vehicle}
            client={client}
            vatRate={vatRate}
            docLocale={docLang}
          />
        )}
      </>
    );
  }

  return (
    <>
      {!compact && (
        <SignLinkShareBlock
          order={order}
          client={client}
          onDocumentLocaleChange={onDocumentLocaleChange}
        />
      )}

      <div className={`flex flex-wrap items-center gap-3 ${compact ? "" : "mt-4"}`}>
        {docIcons}
        {compact && (
          <SignLinkShareBlock
            order={order}
            client={client}
            inline
            onDocumentLocaleChange={onDocumentLocaleChange}
          />
        )}
        {clientWhatsAppHref && (
        <a
          href={clientWhatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          className="wo-doc-icon-btn"
          title={d.sendWhatsApp}
        >
          <MessageCircle size={iconSize} />
        </a>
        )}
        <a
          href={telegramShareUrl(shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className="wo-doc-icon-btn"
          title="Telegram"
        >
          <Send size={iconSize} />
        </a>
      </div>

      {showPrint && (
        <PrintOverlay
          printVariant={printVariant}
          order={order}
          vehicle={vehicle}
          client={client}
          vatRate={vatRate}
          docLocale={docLang}
        />
      )}
    </>
  );
}

function PrintOverlay({
  printVariant,
  order,
  vehicle,
  client,
  vatRate,
  docLocale,
}: {
  printVariant: WorkOrderDocVariant;
  order: WorkOrder;
  vehicle: Vehicle;
  client: User;
  vatRate: number;
  docLocale: DocLocale;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto print:p-0">
      <div className="max-w-[820px] mx-auto print:max-w-none">
        <WorkOrderPrintView
          order={order}
          vehicle={vehicle}
          client={client}
          vatRate={vatRate}
          variant={printVariant}
          docLocale={docLocale}
        />
      </div>
    </div>
  );
}
