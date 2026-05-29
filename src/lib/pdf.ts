import type { WorkOrder, Vehicle, User } from "./store";
import {
  buildWorkOrderDocumentHtml,
  type DocLocale,
  type WorkOrderDocVariant,
} from "./work-order-document";
import { siteConfig } from "./site";

export type PdfLocale = DocLocale;

async function renderHtmlToPdf(
  html: string,
  filename: string,
  variant: WorkOrderDocVariant
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const bg = "#ffffff";
  const host = document.createElement("div");
  host.style.cssText =
    `position:fixed;left:-9999px;top:0;z-index:-1;background:${bg};`;
  host.innerHTML = html;
  document.body.appendChild(host);

  const el = host.querySelector("#bm-work-order-doc") as HTMLElement | null;
  if (!el) {
    document.body.removeChild(host);
    throw new Error("Work order template failed to render");
  }

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: bg,
      logging: false,
    });

    const img = canvas.toDataURL("image/png", 1);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const contentW = pageW - margin * 2;
    const imgH = (canvas.height * contentW) / canvas.width;

    let heightLeft = imgH;
    let position = margin;

    pdf.addImage(img, "PNG", margin, position, contentW, imgH);
    heightLeft -= pageH - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgH - heightLeft);
      pdf.addImage(img, "PNG", margin, position, contentW, imgH);
      heightLeft -= pageH - margin * 2;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
}

function assetUrls() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    logoUrl: `${origin}${siteConfig.logoImage}`,
  };
}

export async function generateWorkOrderPdf(
  order: WorkOrder,
  vehicle: Vehicle,
  client: User,
  locale: PdfLocale = "pl",
  vatRate = 23,
  variant: WorkOrderDocVariant = "color"
): Promise<void> {
  const { logoUrl } = assetUrls();
  const html = buildWorkOrderDocumentHtml(
    order,
    vehicle,
    client,
    locale,
    vatRate,
    logoUrl,
    variant
  );
  const suffix = variant === "bw" ? "-BW" : "";
  await renderHtmlToPdf(
    html,
    `BESS-MOTORS-${order.number}${suffix}.pdf`,
    variant
  );
}

export async function generateWorkOrderPdfColor(
  order: WorkOrder,
  vehicle: Vehicle,
  client: User,
  locale: PdfLocale = "pl",
  vatRate = 23
): Promise<void> {
  return generateWorkOrderPdf(order, vehicle, client, locale, vatRate, "color");
}

export async function generateWorkOrderPdfBw(
  order: WorkOrder,
  vehicle: Vehicle,
  client: User,
  locale: PdfLocale = "pl",
  vatRate = 23
): Promise<void> {
  return generateWorkOrderPdf(order, vehicle, client, locale, vatRate, "bw");
}

export async function getWorkOrderPdfBlob(
  order: WorkOrder,
  vehicle: Vehicle,
  client: User,
  locale: PdfLocale = "pl",
  vatRate = 23,
  variant: WorkOrderDocVariant = "color"
): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const { logoUrl } = assetUrls();
  const html = buildWorkOrderDocumentHtml(
    order,
    vehicle,
    client,
    locale,
    vatRate,
    logoUrl,
    variant
  );

  const bg = "#ffffff";
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-9999px;top:0;z-index:-1;background:${bg};`;
  host.innerHTML = html;
  document.body.appendChild(host);
  const el = host.querySelector("#bm-work-order-doc") as HTMLElement;

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: bg,
  });
  document.body.removeChild(host);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 8;
  const contentW = pageW - margin * 2;
  const imgH = (canvas.height * contentW) / canvas.width;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, contentW, imgH);
  return pdf.output("blob");
}
