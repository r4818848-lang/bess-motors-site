import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";

export function downloadWorkOrderPdf(
  order: WorkOrder,
  vehicleLabel: string,
  locale: "pl" | "ru" | "en" = "pl"
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const L =
    locale === "ru"
      ? { status: "Статус", service: "Услуга", qty: "Кол.", price: "Цена", total: "Итого" }
      : locale === "en"
        ? { status: "Status", service: "Service", qty: "Qty", price: "Price", total: "Total" }
        : { status: "Status", service: "Usługa", qty: "Ilość", price: "Cena", total: "Razem" };

  doc.setFontSize(16);
  doc.text(`BESS MOTORS — ${order.number}`, 14, 16);
  doc.setFontSize(10);
  doc.text(vehicleLabel, 14, 24);
  doc.text(`${L.status}: ${order.status}`, 14, 30);

  const services = order.services.map((s) => [
    s.name,
    String(s.qty),
    `${s.price.toFixed(2)} zł`,
  ]);

  if (services.length) {
    autoTable(doc, {
      startY: 36,
      head: [[L.service, L.qty, L.price]],
      body: services,
    });
  }

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY;
  doc.setFontSize(12);
  doc.text(
    `${L.total}: ${calcClientTotal(order).toFixed(2)} zł`,
    14,
    (finalY ?? 50) + 10
  );

  doc.save(`${order.number.replace(/\W/g, "_")}.pdf`);
}

export function downloadOrdersHistoryPdf(
  orders: WorkOrder[],
  vehicleLabel: string,
  locale: "pl" | "ru" | "en" = "pl"
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const historyTitle =
    locale === "ru" ? "История" : locale === "en" ? "History" : "Historia";
  doc.setFontSize(14);
  doc.text(`BESS MOTORS — ${historyTitle}`, 14, 16);
  doc.setFontSize(10);
  doc.text(vehicleLabel, 14, 24);

  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const body = sorted.map((o) => [
    o.number,
    o.createdAt.slice(0, 10),
    o.status,
    `${calcClientTotal(o).toFixed(0)} zł`,
  ]);

  const headRow =
    locale === "ru"
      ? ["№", "Дата", "Статус", "Сумма"]
      : locale === "en"
        ? ["No.", "Date", "Status", "Total"]
        : ["Nr", "Data", "Status", "Suma"];

  autoTable(doc, {
    startY: 30,
    head: [headRow],
    body,
  });

  doc.save(`bess-history-${Date.now()}.pdf`);
}
