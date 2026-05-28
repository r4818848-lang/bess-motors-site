import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  HOURLY_RATE_PLN,
  priceCategories,
  priceListItems,
  priceListFooterNotes,
} from "@/lib/price-list";

export function downloadPriceListPdf(locale: "pl" | "ru"): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const isRu = locale === "ru";

  doc.setFontSize(18);
  doc.text("BESS MOTORS — " + (isRu ? "Прайс-лист" : "Cennik"), 14, 16);
  doc.setFontSize(10);
  doc.text(
    (isRu ? "Норма-час: " : "Norma-godzina: ") + `${HOURLY_RATE_PLN} zł/h`,
    14,
    24
  );

  let y = 30;

  for (const cat of priceCategories) {
    const items = priceListItems.filter((i) => i.categoryId === cat.id);
    if (!items.length) continue;

    if (y > 260) {
      doc.addPage();
      y = 16;
    }

    doc.setFontSize(12);
    doc.text(isRu ? cat.nameRu : cat.namePl, 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [[isRu ? "Услуга" : "Usługa", isRu ? "Цена" : "Cena"]],
      body: items.map((item) => {
        const name = isRu ? item.nameRu : item.namePl;
        const from = item.priceFrom && item.unit !== "free" ? (isRu ? "от " : "od ") : "";
        if (item.unit === "free") {
          return [name, isRu ? "бесплатно" : "bezpłatnie"];
        }
        if (item.unit === "per_cylinder") {
          return [name, `${from}${item.basePrice} zł / ${isRu ? "цил." : "cyl."}`];
        }
        if (item.unit === "per_wheel") {
          return [name, `${from}${item.basePrice} zł / ${isRu ? "кол." : "koło"}`];
        }
        if (item.unit === "per_100g") {
          return [name, `${from}${item.basePrice} zł / 100g`];
        }
        return [name, `${from}${item.basePrice} zł`];
      }),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [225, 6, 0] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    y += 8;
  }

  doc.setFontSize(8);
  for (const note of priceListFooterNotes) {
    if (y > 285) {
      doc.addPage();
      y = 16;
    }
    const line = isRu ? note.ru : note.pl;
    const split = doc.splitTextToSize(line, 180);
    doc.text(split, 14, y);
    y += split.length * 4;
  }

  doc.save(isRu ? "bess-motors-prajs.pdf" : "bess-motors-cennik.pdf");
}
