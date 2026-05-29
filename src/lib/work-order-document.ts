import type { WorkOrder, Vehicle, User } from "./store";
import { siteConfig } from "./site";
import {
  calcOrderBreakdown,
  calcServiceLine,
  calcPartLine,
} from "./workorder-calc";
import { getWorkOrderLegalTexts } from "./work-order-share";
import {
  getFormDocLabels,
  getFormFooterContent,
  formatDocDate,
} from "./work-order-form-labels";

export type DocLocale = "pl" | "ru" | "en";
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
  if (locale === "en") {
    return {
      title: "WORK ORDER",
      subtitle: "Service document · BESS MOTORS",
      date: "Date",
      client: "Client",
      phone: "Phone",
      vehicle: "Vehicle",
      vin: "VIN",
      plate: "Registration",
      mileage: "Mileage",
      year: "Year",
      engine: "Engine",
      works: "Labour",
      parts: "Parts",
      qty: "Qty",
      price: "Price",
      discount: "Discount",
      total: "Total",
      subtotal: "Subtotal",
      orderDiscount: "Order discount",
      vat: "VAT",
      gross: "AMOUNT DUE",
      notes: "Notes",
      signature: "Client signature",
      confirmation: getWorkOrderLegalTexts("en").confirmation,
      vehiclePickup: getWorkOrderLegalTexts("en").vehiclePickup,
      currency: "PLN",
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

function formField(label: string, value: string): string {
  return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:11px;">
    <span style="color:#666;min-width:110px;">${esc(label)}</span>
    <span style="flex:1;border-bottom:1px solid #999;color:#111;font-weight:500;padding-bottom:2px;">${esc(value) || "&nbsp;"}</span>
  </div>`;
}

function barTitle(text: string, accent: string): string {
  return `<div style="position:relative;background:#1a1a1a;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;padding:7px 28px 7px 24px;margin:0 0 12px;overflow:hidden;">
    ${esc(text)}
    <span style="position:absolute;right:0;top:0;width:22px;height:100%;background:${accent};clip-path:polygon(35% 0,100% 0,100% 100%,0 100%);"></span>
  </div>`;
}

/** Classic A4 form HTML for print / PDF capture */
export function buildWorkOrderDocumentHtml(
  order: WorkOrder,
  vehicle: Vehicle,
  client: User,
  locale: DocLocale = "pl",
  vatRate = 23,
  logoUrl?: string,
  variant: WorkOrderDocVariant = "color"
): string {
  const L = getFormDocLabels(locale);
  const footer = getFormFooterContent(locale);
  const b = calcOrderBreakdown(order, vatRate);
  const logo = logoUrl ?? "/images/logo.png";
  const accent = variant === "bw" ? "#000" : "#e31e24";
  const completionDate =
    order.estimatedReadyAt?.slice(0, 10) ??
    (order.status === "ready" || order.status === "delivered" ? order.updatedAt : "");

  const serviceRows = order.services
    .map(
      (s, i) => `<tr>
      <td style="border:1px solid #bbb;padding:4px 6px;text-align:center;width:28px;">${i + 1}</td>
      <td style="border:1px solid #bbb;padding:4px 6px;">${esc(s.name)}</td>
      <td style="border:1px solid #bbb;padding:4px 6px;text-align:right;font-family:monospace;">${calcServiceLine(s).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const emptyServiceRows = Array.from(
    { length: Math.max(0, 10 - order.services.length) },
    (_, i) => `<tr>
      <td style="border:1px solid #bbb;padding:4px 6px;text-align:center;">${order.services.length + i + 1}</td>
      <td style="border:1px solid #bbb;padding:4px 6px;">&nbsp;</td>
      <td style="border:1px solid #bbb;padding:4px 6px;">&nbsp;</td>
    </tr>`
  ).join("");

  const partRows = order.parts
    .map(
      (p) => `<tr>
      <td style="border:1px solid #bbb;padding:4px 6px;">${esc(p.name)}</td>
      <td style="border:1px solid #bbb;padding:4px 6px;text-align:center;width:36px;">${p.qty}</td>
      <td style="border:1px solid #bbb;padding:4px 6px;text-align:right;font-family:monospace;">${calcPartLine(p).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const emptyPartRows = Array.from(
    { length: Math.max(0, 10 - order.parts.length) },
    () => `<tr>
      <td style="border:1px solid #bbb;padding:4px 6px;">&nbsp;</td>
      <td style="border:1px solid #bbb;padding:4px 6px;">&nbsp;</td>
      <td style="border:1px solid #bbb;padding:4px 6px;">&nbsp;</td>
    </tr>`
  ).join("");

  const benefitsHtml = footer.benefits
    .map(
      (item) => `<td style="width:25%;vertical-align:top;padding:8px;font-size:9px;color:#444;line-height:1.35;">
        <div style="width:32px;height:32px;border:2px solid ${accent};border-radius:50%;margin-bottom:6px;"></div>
        <strong style="color:${accent};">${esc(item.title)}</strong><br/>${esc(item.desc)}
      </td>`
    )
    .join("");

  const sigImg = order.signature?.dataUrl
    ? `<img src="${order.signature.dataUrl}" alt="" style="height:40px;max-width:180px;display:block;margin:4px 0;${variant === "bw" ? "filter:grayscale(1);" : ""}" />`
    : "";

  return `<div id="bm-work-order-doc" data-variant="${variant}" style="width:794px;font-family:'Segoe UI',system-ui,sans-serif;color:#111;background:#fff;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;${variant === "bw" ? "filter:grayscale(1);" : ""}">
  <div style="padding:24px 28px 16px;border-bottom:1px solid #ccc;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:28%;vertical-align:top;"><img src="${esc(logo)}" alt="BESS MOTORS" style="height:52px;width:auto;" /></td>
        <td style="text-align:center;vertical-align:middle;">
          <h1 style="margin:0;font-size:20px;font-weight:800;text-transform:uppercase;line-height:1.2;">${esc(L.title)}</h1>
          <p style="margin:4px 0 0;font-size:14px;font-weight:700;text-transform:uppercase;">№ <span style="color:${accent};font-family:Consolas,monospace;">${esc(order.number)}</span></p>
        </td>
        <td style="width:30%;vertical-align:top;text-align:right;font-size:10px;color:#444;line-height:1.5;">
          <div>${esc(siteConfig.phone)}</div>
          <div>${esc(L.website)}</div>
          <div>${esc(siteConfig.address)}</div>
        </td>
      </tr>
    </table>
    <table style="width:100%;margin-top:16px;border-top:1px solid #eee;padding-top:12px;">
      <tr>
        <td style="width:50%;font-size:11px;color:#555;">${esc(L.receptionDate)}<div style="border-bottom:1px solid #999;margin-top:4px;font-weight:600;color:#111;">${esc(formatDocDate(order.createdAt))}</div></td>
        <td style="width:50%;font-size:11px;color:#555;padding-left:24px;">${esc(L.completionDate)}<div style="border-bottom:1px solid #999;margin-top:4px;font-weight:600;color:#111;">${esc(formatDocDate(completionDate))}</div></td>
      </tr>
    </table>
  </div>

  <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #ccc;">
    <tr>
      <td style="width:50%;vertical-align:top;border-right:1px solid #eee;">
        ${barTitle(L.vehicleData, accent)}
        <div style="padding:0 20px 16px;">
        ${formField(L.makeModel, `${vehicle.make} ${vehicle.model}`.trim())}
        ${formField(L.year, vehicle.year ? String(vehicle.year) : "—")}
        ${formField(L.plate, vehicle.plate)}
        ${formField(L.vin, vehicle.vin || "—")}
        ${formField(L.mileage, vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "—")}
        </div>
      </td>
      <td style="width:50%;vertical-align:top;">
        ${barTitle(L.clientData, accent)}
        <div style="padding:0 20px 16px;">
        ${formField(L.fullName, client.name)}
        ${formField(L.phone, client.phone)}
        ${formField(L.email, client.email || siteConfig.email)}
        </div>
      </td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #ccc;">
    <tr>
      <td style="width:50%;vertical-align:top;border-right:1px solid #eee;">
        ${barTitle(L.workList, accent)}
        <div style="padding:0 16px 16px;">
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <thead><tr style="background:#1a1a1a;color:#fff;">
            <th style="border:1px solid #333;padding:5px;color:#fff;">${esc(L.numberCol)}</th>
            <th style="border:1px solid #333;padding:5px;text-align:left;color:#fff;">${esc(L.workName)}</th>
            <th style="border:1px solid #333;padding:5px;text-align:right;color:#fff;">${esc(L.cost)}</th>
          </tr></thead>
          <tbody>${serviceRows}${emptyServiceRows}</tbody>
        </table>
        </div>
      </td>
      <td style="width:50%;vertical-align:top;">
        ${barTitle(L.partsMaterials, accent)}
        <div style="padding:0 16px 16px;">
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <thead><tr style="background:#1a1a1a;color:#fff;">
            <th style="border:1px solid #333;padding:5px;text-align:left;color:#fff;">${esc(L.partName)}</th>
            <th style="border:1px solid #333;padding:5px;color:#fff;">${esc(L.qty)}</th>
            <th style="border:1px solid #333;padding:5px;text-align:right;color:#fff;">${esc(L.cost)}</th>
          </tr></thead>
          <tbody>${partRows}${emptyPartRows}</tbody>
        </table>
        </div>
      </td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #ccc;">
    <tr>
      <td style="width:55%;vertical-align:top;border-right:1px solid #eee;">
        ${barTitle(L.additionalInfo, accent)}
        <div style="margin:0 20px 16px;min-height:90px;border:1px solid #bbb;background:#fafafa;padding:10px;font-size:11px;line-height:1.5;">${esc(order.clientNotes || "")}</div>
      </td>
      <td style="width:45%;vertical-align:top;padding:0 20px 16px;">
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:44px;">
          <tr><td style="border:1px solid #bbb;padding:8px;">${esc(L.worksCost)}</td><td style="border:1px solid #bbb;padding:8px;text-align:right;font-family:monospace;">${b.servicesSub.toFixed(2)}</td></tr>
          <tr><td style="border:1px solid #bbb;padding:8px;">${esc(L.partsCost)}</td><td style="border:1px solid #bbb;padding:8px;text-align:right;font-family:monospace;">${b.partsSub.toFixed(2)}</td></tr>
          ${b.discount > 0 ? `<tr><td style="border:1px solid #bbb;padding:8px;">${esc(L.orderDiscount)}</td><td style="border:1px solid #bbb;padding:8px;text-align:right;color:${accent};">-${b.discount.toFixed(2)}</td></tr>` : ""}
          ${order.vatEnabled && b.vatAmount > 0 ? `<tr><td style="border:1px solid #bbb;padding:8px;">${esc(L.vat)} (${b.vatRate}%)</td><td style="border:1px solid #bbb;padding:8px;text-align:right;">${b.vatAmount.toFixed(2)}</td></tr>` : ""}
          <tr style="background:#f3f3f3;"><td style="border:1px solid #bbb;padding:10px;font-weight:800;color:#111;text-transform:uppercase;">${esc(L.totalToPay)}</td><td style="border:1px solid #bbb;padding:10px;text-align:right;font-family:monospace;font-weight:800;color:${accent};font-size:16px;">${b.grossTotal.toFixed(2)} ${esc(L.currency)}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #ccc;">
    <tr>
      <td style="width:50%;padding:16px 20px;border-right:1px solid #eee;vertical-align:top;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:600;">${esc(L.executor)}</p>
        <div style="border-bottom:1px solid #666;height:32px;margin-bottom:8px;"></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#666;text-transform:uppercase;"><span>${esc(L.signLabel)}</span><span>${esc(L.dateLabel)}</span></div>
      </td>
      <td style="width:50%;padding:16px 20px;vertical-align:top;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:600;">${esc(L.clientSign)}</p>
        ${sigImg}
        <div style="border-bottom:1px solid #666;height:${sigImg ? "8" : "32"}px;margin-bottom:8px;"></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#666;text-transform:uppercase;"><span>${esc(L.signLabel)}</span><span>${esc(L.dateLabel)}</span></div>
      </td>
    </tr>
  </table>

  <div style="padding:16px 20px 0;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;"><tr>${benefitsHtml}</tr></table>
  </div>
  <div style="background:#1a1a1a;color:#fff;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;padding:12px 16px;">
    <span style="color:${accent};">BESS MOTORS</span> — ${esc(footer.slogan.replace(/^BESS MOTORS — /, ""))}
  </div>
</div>`;
}
