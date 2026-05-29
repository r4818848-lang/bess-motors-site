"use client";

import { useState, type ReactNode } from "react";
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
import { pdfLocale as getPdfLocale } from "@/lib/i18n/locale-utils";
import type { WorkOrder, Vehicle, User } from "@/lib/store";
import { loadDb } from "@/lib/store";
import {
  generateWorkOrderPdfColor,
  generateWorkOrderPdfBw,
} from "@/lib/pdf";
import type { WorkOrderDocVariant } from "@/lib/work-order-document";
import { WorkOrderPrintView } from "./WorkOrderPrintView";
import { buildShareMessage, whatsappShareUrl, telegramShareUrl } from "@/lib/work-order-share";
import { SignLinkShareBlock } from "./SignLinkShareBlock";

interface Props {
  order: WorkOrder;
  client: User;
  vehicle: Vehicle | undefined;
  compact?: boolean;
  /** Icon toolbar in the top-right of the work order card */
  iconToolbar?: boolean;
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
}: Props) {
  const { t, locale } = useI18n();
  const d = t.document;
  const [showPrint, setShowPrint] = useState(false);
  const [printVariant, setPrintVariant] = useState<WorkOrderDocVariant>("color");
  const [showPreview, setShowPreview] = useState(false);
  const [previewVariant, setPreviewVariant] = useState<WorkOrderDocVariant>("color");
  const [pdfLoading, setPdfLoading] = useState<"color" | "bw" | null>(null);
  const db = loadDb();
  const vatRate = db.settings.vatRate ?? 23;
  const lang = getPdfLocale(locale);
  const shareText = buildShareMessage(order, client, lang);

  const handlePrint = (variant: WorkOrderDocVariant) => {
    setPrintVariant(variant);
    setShowPrint(true);
    requestAnimationFrame(() => {
      window.print();
      setTimeout(() => setShowPrint(false), 500);
    });
  };

  const pdfLocale = lang;

  if (!vehicle) return null;

  const iconSize = 18;

  const docIcons = (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      <WoDocIconButton
        title={d.preview}
        onClick={() => {
          setPreviewVariant("color");
          setShowPreview(true);
        }}
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
            await generateWorkOrderPdfColor(order, vehicle, client, pdfLocale, vatRate);
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
            await generateWorkOrderPdfBw(order, vehicle, client, pdfLocale, vatRate);
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
        {(showPreview || showPrint) && (
          <PrintPreviewOverlay
            showPreview={showPreview}
            showPrint={showPrint}
            previewVariant={previewVariant}
            printVariant={printVariant}
            onPreviewVariant={setPreviewVariant}
            onClosePreview={() => setShowPreview(false)}
            onPrintColor={() => handlePrint("color")}
            onPrintBw={() => handlePrint("bw")}
            order={order}
            vehicle={vehicle}
            client={client}
            vatRate={vatRate}
            d={d}
          />
        )}
      </>
    );
  }

  return (
    <>
      {!compact && <SignLinkShareBlock order={order} client={client} />}

      <div className={`flex flex-wrap items-center gap-3 ${compact ? "" : "mt-4"}`}>
        {docIcons}
        {compact && <SignLinkShareBlock order={order} client={client} inline />}
        <a
          href={whatsappShareUrl(shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className="wo-doc-icon-btn"
          title="WhatsApp"
        >
          <MessageCircle size={iconSize} />
        </a>
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

      {(showPreview || showPrint) && (
        <PrintPreviewOverlay
          showPreview={showPreview}
          showPrint={showPrint}
          previewVariant={previewVariant}
          printVariant={printVariant}
          onPreviewVariant={setPreviewVariant}
          onClosePreview={() => setShowPreview(false)}
          onPrintColor={() => handlePrint("color")}
          onPrintBw={() => handlePrint("bw")}
          order={order}
          vehicle={vehicle}
          client={client}
          vatRate={vatRate}
          d={d}
        />
      )}
    </>
  );
}

function PrintPreviewOverlay({
  showPreview,
  showPrint,
  previewVariant,
  printVariant,
  onPreviewVariant,
  onClosePreview,
  onPrintColor,
  onPrintBw,
  order,
  vehicle,
  client,
  vatRate,
  d,
}: {
  showPreview: boolean;
  showPrint: boolean;
  previewVariant: WorkOrderDocVariant;
  printVariant: WorkOrderDocVariant;
  onPreviewVariant: (v: WorkOrderDocVariant) => void;
  onClosePreview: () => void;
  onPrintColor: () => void;
  onPrintBw: () => void;
  order: WorkOrder;
  vehicle: Vehicle;
  client: User;
  vatRate: number;
  d: {
    printColor: string;
    printBw: string;
    preview: string;
  };
}) {
  const variant = showPrint ? printVariant : previewVariant;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-black/90 overflow-y-auto p-4 ${showPrint ? "print:p-0 print:bg-white" : ""}`}
      onClick={() => !showPrint && onClosePreview()}
    >
      {showPreview && !showPrint && (
        <div
          className="sticky top-0 z-10 flex flex-wrap justify-center items-center gap-2 py-3 print:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={`wo-doc-icon-btn ${previewVariant === "color" ? "wo-doc-icon-btn-active" : ""}`}
            onClick={() => onPreviewVariant("color")}
            title={d.printColor}
          >
            <Palette size={16} />
          </button>
          <button
            type="button"
            className={`wo-doc-icon-btn ${previewVariant === "bw" ? "wo-doc-icon-btn-active" : ""}`}
            onClick={() => onPreviewVariant("bw")}
            title={d.printBw}
          >
            <Contrast size={16} />
          </button>
          <button type="button" className="wo-doc-icon-btn" onClick={onPrintColor} title={d.printColor}>
            <Printer size={16} />
          </button>
          <button
            type="button"
            className="wo-doc-icon-btn text-bm-muted hover:text-white"
            onClick={onClosePreview}
            title={d.preview}
          >
            ✕
          </button>
        </div>
      )}
      <div
        className="max-w-[820px] mx-auto print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        <WorkOrderPrintView
          order={order}
          vehicle={vehicle}
          client={client}
          vatRate={vatRate}
          variant={variant}
        />
      </div>
    </div>
  );
}
