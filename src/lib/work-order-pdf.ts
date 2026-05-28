import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";

export function downloadWorkOrderPdf(
  order: WorkOrder,
  vehicleLabel: string,
  locale: "pl" | "ru" = "pl"
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const isRu = locale === "ru";

  doc.setFontSize(16);
  doc.text(`BESS MOTORS — ${order.number}`, 14, 16);
  doc.setFontSize(10);
  doc.text(vehicleLabel, 14, 24);
  doc.text(`${isRu ? "Статус" : "Status"}: ${order.status}`, 14, 30);

  const services = order.services.map((s) => [
    s.name,
    String(s.qty),
    `${s.price.toFixed(2)} zł`,
  ]);

  if (services.length) {
    autoTable(doc, {
      startY: 36,
      head: [[isRu ? "Услуга" : "Usługa", isRu ? "Кол." : "Ilość", isRu ? "Цена" : "Cena"]],
      body: services,
    });
  }

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY;
  doc.setFontSize(12);
  doc.text(
    `${isRu ? "Итого" : "Razem"}: ${calcClientTotal(order).toFixed(2)} zł`,
    14,
    (finalY ?? 50) + 10
  );

  doc.save(`${order.number.replace(/\W/g, "_")}.pdf`);
}

export function downloadOrdersHistoryPdf(
  orders: WorkOrder[],
  vehicleLabel: string,
  locale: "pl" | "ru" = "pl"
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const isRu = locale === "ru";
  doc.setFontSize(14);
  doc.text(`BESS MOTORS — ${isRu ? "История" : "Historia"}`, 14, 16);
  doc.setFontSize(10);
  doc.text(vehicleLabel, 14, 24);

  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const body = sorted.map((o) => [
    o.number,
    o.createdAt.slice(0, 10),
    o.status,
    `${calcClientTotal(o).toFixed(0)} zł`,
  ]);

  autoTable(doc, {
    startY: 30,
    head: [[isRu ? "№" : "Nr", isRu ? "Дата" : "Data", isRu ? "Статус" : "Status", isRu ? "Сумма" : "Suma"]],
    body,
  });

  doc.save(`bess-history-${Date.now()}.pdf`);
}
