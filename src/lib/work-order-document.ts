import type { WorkOrder, Vehicle, User } from "./store";
import { siteConfig } from "./site";
import {
  calcOrderBreakdown,
  calcServiceLine,
  calcPartLine,
} from "./workorder-calc";
import { getWorkOrderLegalTexts } from "./work-order-share";

export type DocLocale = "pl" | "ru";
export type WorkOrderDocVariant = "color" | "bw";

export function getDocLabels(locale: DocLocale) {
  if (locale === "ru") {
    return {
      title: "ЗАКАЗ-НАРЯД",
      subtitle: "Сервисный документ · BESS MOTORS",
      date: "Дата",
      client: "Клиент",
      phone: "Телефон",
      vehicle: "Автомобиль",
      vin: "VIN",
      plate: "Госномер",
      mileage: "Пробег",
      year: "Год",
      engine: "Двигатель",
      works: "Работы",
      parts: "Запчасти",
      qty: "Кол-во",
      price: "Цена",
      discount: "Скидка",
      total: "Итого",
      subtotal: "Сумма",
      orderDiscount: "Скидка по заказу",
      vat: "НДС",
      gross: "К ОПЛАТЕ",
      notes: "Комментарий",
      signature: "Подпись клиента",
      confirmation: getWorkOrderLegalTexts("ru").confirmation,
      vehiclePickup: getWorkOrderLegalTexts("ru").vehiclePickup,
      currency: "zł",
      empty: "—",
    };
  }
  return {
    title: "ZLECENIE NAPRAWCZE",
    subtitle: "Dokument serwisowy · BESS MOTORS",
    date: "Data",
    client: "Klient",
    phone: "Telefon",
    vehicle: "Pojazd",
    vin: "VIN",
    plate: "Rejestracja",
    mileage: "Przebieg",
    year: "Rok",
    engine: "Silnik",
    works: "Prace",
    parts: "Części",
    qty: "Ilość",
    price: "Cena",
    discount: "Rabat",
    total: "Suma",
    subtotal: "Suma",
    orderDiscount: "Rabat zlecenia",
    vat: "VAT",
    gross: "DO ZAPŁATY",
    notes: "Uwagi",
    signature: "Podpis klienta",
    confirmation: getWorkOrderLegalTexts("pl").confirmation,
    vehiclePickup: getWorkOrderLegalTexts("pl").vehiclePickup,
    currency: "zł",
    empty: "—",
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function docPalette(variant: WorkOrderDocVariant) {
  if (variant === "bw") {
    return {
      accent: "#000000",
      accentMid: "#333333",
      text: "#111111",
      textLight: "#444444",
      textMuted: "#666666",
      textOnDark: "#ffffff",
      bg: "#ffffff",
      bgPanel: "#f4f4f4",
      rowA: "#ffffff",
      rowB: "#f8f8f8",
      border: "#cccccc",
      cardBorder: "#999999",
      headerOverlay: "rgba(255,255,255,0.92)",
      bodyOverlay: "rgba(255,255,255,0.96)",
      logoFilter: "grayscale(1) contrast(1.1)",
      glow: "",
    };
  }
  return {
    accent: "#e10600",
    accentMid: "#a00400",
    text: "#e8e8e8",
    textLight: "#c0c0c0",
    textMuted: "#888888",
    textOnDark: "#ffffff",
    bg: "#0a0a0a",
    bgPanel: "rgba(10,10,10,0.85)",
    rowA: "rgba(10,10,10,0.85)",
    rowB: "rgba(20,20,20,0.9)",
    border: "#2a2a2a",
    cardBorder: "rgba(225,6,0,0.35)",
    headerOverlay: "rgba(0,0,0,0.55)",
    bodyOverlay: "rgba(0,0,0,0.72)",
    logoFilter: "drop-shadow(0 0 12px rgba(225,6,0,0.5))",
    glow: "0 0 40px rgba(225,6,0,0.2)",
  };
}

function tableRows(
  items: { name: string; qty: number; price: number; discount: number; line: number }[],
  variant: WorkOrderDocVariant
): string {
  const P = docPalette(variant);
  if (!items.length) {
    return `<tr><td colspan="5" style="padding:12px;text-align:center;color:${P.textMuted};">—</td></tr>`;
  }
  return items
    .map(
      (r, i) => `
    <tr style="background:${i % 2 ? P.rowB : P.rowA};">
      <td style="padding:10px 12px;border-bottom:1px solid ${P.border};color:${P.text};">${esc(r.name)}</td>
      <td style="padding:10px;text-align:center;border-bottom:1px solid ${P.border};color:${P.textLight};">${r.qty}</td>
      <td style="padding:10px;text-align:right;border-bottom:1px solid ${P.border};color:${P.textLight};">${r.price.toFixed(2)}</td>
      <td style="padding:10px;text-align:center;border-bottom:1px solid ${P.border};color:${P.textMuted};">${r.discount > 0 ? `-${r.discount}%` : "—"}</td>
      <td style="padding:10px;text-align:right;border-bottom:1px solid ${P.border};font-weight:700;color:${P.accent};">${r.line.toFixed(2)}</td>
    </tr>`
    )
    .join("");
}

function premiumSlogan(locale: DocLocale): string {
  return locale === "ru"
    ? "ВАШ АВТОМОБИЛЬ В НАДЁЖНЫХ РУКАХ!"
    : "TWOJ SAMOCHÓD W DOBRYCH RĘKACH!";
}

/** Premium HTML for print / PDF capture (color = forged carbon, bw = print-friendly) */
export function buildWorkOrderDocumentHtml(
  order: WorkOrder,
  vehicle: Vehicle,
  client: User,
  locale: DocLocale = "ru",
  vatRate = 23,
  logoUrl?: string,
  variant: WorkOrderDocVariant = "color",
  carbonUrl?: string
): string {
  const L = getDocLabels(locale);
  const P = docPalette(variant);
  const b = calcOrderBreakdown(order, vatRate);
  const logo = logoUrl ?? "/images/logo.png";
  const carbon = carbonUrl ?? siteConfig.forgedCarbonImage;

  const services = order.services.map((s) => ({
    name: s.name,
    qty: s.qty,
    price: s.price,
    discount: s.discount,
    line: calcServiceLine(s),
  }));

  const parts = order.parts.map((p) => ({
    name: p.name,
    qty: p.qty,
    price: p.sellPrice,
    discount: p.discount,
    line: calcPartLine(p),
  }));

  const slogan = premiumSlogan(locale);
  const badges =
    locale === "ru"
      ? ["БЫСТРО", "ПРОФЕССИОНАЛЬНО", "ГАРАНТИЯ", "PREMIUM SERVICE"]
      : ["SZYBKO", "PROFESJONALNIE", "GWARANCJA", "PREMIUM SERVICE"];

  const legalBlock = `
      <p style="font-size:11px;color:${variant === "bw" ? P.textLight : "#ccc"};margin:0 0 10px;line-height:1.55;">${esc(L.confirmation)}</p>
      <p style="font-size:11px;color:${variant === "bw" ? P.textLight : "#ccc"};margin:0 0 12px;line-height:1.55;">${esc(L.vehiclePickup)}</p>`;

  const sigBlock = order.signature
    ? `
    <div style="padding:16px;border:1px solid ${P.cardBorder};border-radius:10px;background:${variant === "bw" ? P.bgPanel : "rgba(20,20,20,0.95)"};">
      ${legalBlock}
      ${order.signature.dataUrl ? `<img src="${order.signature.dataUrl}" alt="signature" style="height:56px;max-width:200px;display:block;margin-bottom:8px;${variant === "bw" ? "filter:grayscale(1);" : ""}" />` : ""}
      <p style="font-size:10px;color:${P.textMuted};margin:0;">${esc(order.signature.signedBy)} · ${esc(new Date(order.signature.signedAt).toLocaleString())}</p>
    </div>`
    : `<div style="padding:16px;border:2px dashed ${P.border};border-radius:10px;">
        ${legalBlock}
        <p style="font-size:11px;color:${P.textMuted};margin:12px 0 0;">${L.signature}: ___________________________</p>
      </div>`;

  const cardStyle =
    variant === "bw"
      ? `background:${P.bgPanel};border:1px solid ${P.cardBorder};border-radius:10px;padding:16px;vertical-align:top;`
      : `background:linear-gradient(145deg,#1a1a1a 0%,#0e0e0e 100%);border:1px solid ${P.cardBorder};border-radius:10px;padding:16px;vertical-align:top;`;

  const rootBg =
    variant === "color"
      ? `background-color:#0a0a0a;background-image:url('${esc(carbon)}');background-size:cover;background-position:center;`
      : `background:${P.bg};`;

  const headerBg =
    variant === "color"
      ? `background:${P.headerOverlay};`
      : `background:${P.bgPanel};border-bottom:2px solid #000;`;

  const badgeRadius = "border-radius:9999px;";
  const badgeStyle =
    variant === "bw"
      ? `display:inline-block;margin:0 6px 6px 0;padding:10px 16px;border:1px solid #000;color:#000;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:#fff;${badgeRadius}`
      : `display:inline-block;margin:0 6px 6px 0;padding:10px 16px;border:1px solid rgba(225,6,0,0.9);color:#e10600;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:transparent;${badgeRadius}`;

  const worksHead =
    variant === "bw"
      ? `background:linear-gradient(90deg,#333,#666,#eee);color:#fff;`
      : `background:linear-gradient(90deg,#e10600,#a00400,#1a1a1a);color:#fff;`;

  const partsHead =
    variant === "bw"
      ? `background:linear-gradient(90deg,#eee,#ccc,#fff);color:#000;`
      : `background:linear-gradient(90deg,#1a1a1a,#333,#0a0a0a);color:#fff;`;

  const redGlow =
    variant === "color"
      ? `<div style="position:absolute;top:0;right:0;width:240px;height:240px;background:radial-gradient(circle,rgba(225,6,0,0.35) 0%,transparent 70%);"></div>`
      : "";

  const divider =
    variant === "bw"
      ? `height:2px;background:#000;margin-top:20px;`
      : `height:3px;background:linear-gradient(90deg,transparent,#e10600,#ff4444,#e10600,transparent);margin-top:20px;`;

  const totalBox =
    variant === "bw"
      ? `display:inline-block;min-width:260px;padding:22px;border:2px solid #000;border-radius:12px;background:#f8f8f8;`
      : `display:inline-block;min-width:260px;padding:22px;border:2px solid #e10600;border-radius:12px;background:linear-gradient(145deg,#1a1a1a,#0a0a0a);box-shadow:0 0 32px rgba(225,6,0,0.25);`;

  const grossShadow = variant === "color" ? "text-shadow:0 0 16px rgba(225,6,0,0.5);" : "";

  return `<div id="bm-work-order-doc" data-variant="${variant}" style="width:794px;font-family:'Segoe UI',system-ui,sans-serif;color:${P.text};${rootBg}box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
  <div style="${headerBg}color:${variant === "bw" ? P.text : "#fff"};padding:28px 32px 24px;position:relative;overflow:hidden;">
    ${redGlow}
    <table style="width:100%;border-collapse:collapse;position:relative;z-index:1;">
      <tr>
        <td style="vertical-align:top;width:48%;">
          <img src="${esc(logo)}" alt="BESS MOTORS" style="height:52px;width:auto;margin-bottom:12px;display:block;filter:${P.logoFilter};" />
          <p style="margin:0;font-size:10px;letter-spacing:0.2em;color:${P.accent};font-weight:700;">${L.title}</p>
          <p style="margin:8px 0 0;font-size:26px;font-weight:800;font-family:Consolas,monospace;color:${P.accent};">${esc(order.number)}</p>
          <p style="margin:6px 0 0;font-size:11px;color:${variant === "bw" ? P.textMuted : "#aaa"};">${L.date}: ${esc(order.createdAt)}</p>
        </td>
        <td style="vertical-align:top;text-align:right;width:52%;">
          <p style="margin:0;font-size:22px;font-weight:700;text-transform:uppercase;line-height:1.15;color:${variant === "bw" ? P.text : "#ffffff"};letter-spacing:0.02em;text-shadow:${P.glow};">${esc(slogan)}</p>
          <p style="margin:14px 0 0;font-size:0;line-height:0;">
            ${badges.map((b) => `<span style="${badgeStyle}">${esc(b)}</span>`).join("")}
          </p>
        </td>
      </tr>
    </table>
    <div style="${divider}"></div>
  </div>

  <div style="padding:24px 32px 32px;${variant === "color" ? `background:${P.bodyOverlay};` : `background:${P.bg};`}">
    <table style="width:100%;border-collapse:separate;border-spacing:12px 0;margin-bottom:20px;">
      <tr>
        <td style="width:50%;${cardStyle}">
          <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${P.accent};text-transform:uppercase;">${L.client}</p>
          <p style="margin:0;font-size:17px;font-weight:700;color:${variant === "bw" ? P.text : "#fff"};">${esc(client.name)}</p>
          <p style="margin:6px 0 0;font-size:12px;color:${P.textLight};font-family:monospace;">${esc(client.phone)}</p>
        </td>
        <td style="width:50%;${cardStyle}">
          <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${variant === "bw" ? P.textMuted : "#c0c0c0"};text-transform:uppercase;">${L.vehicle}</p>
          <p style="margin:0;font-size:17px;font-weight:700;color:${variant === "bw" ? P.text : "#fff"};">${esc(vehicle.make)} ${esc(vehicle.model)}</p>
          <p style="margin:8px 0 0;font-size:10px;color:${P.textMuted};font-family:monospace;">${L.vin}: ${esc(vehicle.vin)}</p>
          <p style="margin:4px 0 0;font-size:11px;color:${P.textLight};">${L.plate}: <strong style="color:${P.accent};">${esc(vehicle.plate)}</strong> · ${L.mileage}: ${vehicle.mileage.toLocaleString()} km</p>
        </td>
      </tr>
    </table>

    ${order.clientNotes ? `<p style="margin:0 0 16px;padding:12px 16px;border-left:4px solid ${P.accent};background:${variant === "bw" ? "#f0f0f0" : "rgba(225,6,0,0.08)"};font-size:12px;color:${P.textLight};font-style:italic;">${esc(order.clientNotes)}</p>` : ""}

    <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:${P.accent};text-transform:uppercase;">${L.works}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid ${P.cardBorder};border-radius:8px;overflow:hidden;">
      <thead><tr style="${worksHead}">
        <th style="padding:10px 12px;text-align:left;font-size:9px;text-transform:uppercase;">${L.works}</th>
        <th style="padding:10px;font-size:9px;text-align:center;">${L.qty}</th>
        <th style="padding:10px;font-size:9px;text-align:right;">${L.price}</th>
        <th style="padding:10px;font-size:9px;text-align:center;">${L.discount}</th>
        <th style="padding:10px;font-size:9px;text-align:right;">${L.total}</th>
      </tr></thead>
      <tbody>${tableRows(services, variant)}</tbody>
    </table>

    <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:${variant === "bw" ? P.textMuted : "#c0c0c0"};text-transform:uppercase;">${L.parts}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid ${P.cardBorder};border-radius:8px;overflow:hidden;">
      <thead><tr style="${partsHead}">
        <th style="padding:10px 12px;text-align:left;font-size:9px;text-transform:uppercase;">${L.parts}</th>
        <th style="padding:10px;font-size:9px;text-align:center;">${L.qty}</th>
        <th style="padding:10px;font-size:9px;text-align:right;">${L.price}</th>
        <th style="padding:10px;font-size:9px;text-align:center;">${L.discount}</th>
        <th style="padding:10px;font-size:9px;text-align:right;">${L.total}</th>
      </tr></thead>
      <tbody>${tableRows(parts, variant)}</tbody>
    </table>

    <table style="width:100%;"><tr>
      <td style="vertical-align:top;width:52%;">${sigBlock}</td>
      <td style="vertical-align:top;text-align:right;">
        <div style="${totalBox}">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:${P.textMuted};margin-bottom:6px;"><span>${L.subtotal}</span><span style="color:${P.textLight};">${b.subtotal.toFixed(2)} ${L.currency}</span></div>
          ${b.discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:${P.accent};margin-bottom:6px;"><span>${L.orderDiscount}</span><span>-${b.discount.toFixed(2)} ${L.currency}</span></div>` : ""}
          ${order.vatEnabled && b.vatAmount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:${P.textMuted};margin-bottom:6px;"><span>${L.vat} (${b.vatRate}%)</span><span>${b.vatAmount.toFixed(2)} ${L.currency}</span></div>` : ""}
          <div style="height:2px;background:${variant === "bw" ? "#000" : "linear-gradient(90deg,transparent,#e10600,transparent)"};margin:14px 0;"></div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:${P.accent};">${L.gross}</span>
            <span style="font-size:28px;font-weight:800;color:${P.accent};font-family:Consolas,monospace;${grossShadow}">${b.grossTotal.toFixed(2)} <span style="font-size:14px;">${L.currency}</span></span>
          </div>
        </div>
      </td>
    </tr></table>

    <p style="margin-top:28px;padding-top:12px;border-top:1px solid ${P.border};font-size:9px;color:${P.textMuted};text-align:center;">
      ${esc(siteConfig.name)} · ${esc(siteConfig.address)} · ${esc(siteConfig.phone)}
    </p>
  </div>
</div>`;
}
