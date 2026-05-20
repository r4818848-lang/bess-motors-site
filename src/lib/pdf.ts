import type { WorkOrder, Vehicle, User } from "./store";
import {
  calcClientTotal,
  calcServiceLine,
  calcPartLine,
  calcOrderDiscountAmount,
  calcSubtotal,
} from "./workorder-calc";

export async function generateWorkOrderPdf(
  order: WorkOrder,
  vehicle: Vehicle,
  client: User
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF();
  const total = calcClientTotal(order);
  const discount = calcOrderDiscountAmount(order);
  const subtotal = calcSubtotal(order);

  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(225, 6, 0);
  doc.setFontSize(22);
  doc.text("BESS MOTORS", 14, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Serwis Samochodowy", 14, 26);
  doc.text(`Zlecenie: ${order.number}`, 14, 34);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(`Klient: ${client.name} | ${client.phone}`, 14, 50);
  doc.text(
    `Pojazd: ${vehicle.make} ${vehicle.model} | VIN: ${vehicle.vin} | ${vehicle.plate}`,
    14,
    58
  );
  doc.text(`Data: ${order.createdAt}`, 14, 66);

  const serviceRows = order.services.map((s) => [
    s.name,
    s.qty.toString(),
    `${s.price} zł`,
    `${s.discount}%`,
    `${calcServiceLine(s).toFixed(2)} zł`,
  ]);

  // @ts-expect-error autotable plugin
  doc.autoTable({
    startY: 72,
    head: [["Praca", "Ilosc", "Cena", "Rabat", "Suma"]],
    body: serviceRows,
    theme: "grid",
    headStyles: { fillColor: [225, 6, 0] },
  });

  const partsRows = order.parts.map((p) => [
    p.name,
    p.qty.toString(),
    `${p.sellPrice} zł`,
    `${p.discount}%`,
    `${calcPartLine(p).toFixed(2)} zł`,
  ]);

  // @ts-expect-error autotable plugin
  doc.autoTable({
    // @ts-expect-error lastAutoTable
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Czesc", "Ilosc", "Cena", "Rabat", "Suma"]],
    body: partsRows,
    theme: "grid",
    headStyles: { fillColor: [30, 30, 30] },
  });

  // @ts-expect-error lastAutoTable
  let finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Suma: ${subtotal.toFixed(2)} zł`, 14, finalY);
  if (discount > 0) {
    finalY += 6;
    doc.setTextColor(225, 6, 0);
    doc.text(`Rabat: -${discount.toFixed(2)} zł`, 14, finalY);
  }
  finalY += 10;
  doc.setFontSize(14);
  doc.text(`DO ZAPLATY: ${total.toFixed(2)} zł`, 14, finalY);

  finalY += 14;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  if (order.signature?.dataUrl) {
    try {
      doc.addImage(order.signature.dataUrl, "PNG", 14, finalY, 60, 24);
      finalY += 28;
      doc.text(
        `Podpis: ${order.signature.signedBy} | ${new Date(order.signature.signedAt).toLocaleString()}`,
        14,
        finalY
      );
    } catch {
      doc.text("Podpis klienta: [zapisany elektronicznie]", 14, finalY);
    }
  } else {
    doc.text("Podpis klienta: _________________________", 14, finalY);
    finalY += 8;
  }
  doc.text("BESS MOTORS — Aleja Krakowska 48/52, Warszawa | +48 791 257 229", 14, finalY + 12);

  doc.save(`BESS-MOTORS-${order.number}.pdf`);
}
