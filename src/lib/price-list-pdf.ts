import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  HOURLY_RATE_PLN,
  priceCategories,
  priceListItems,
  priceListFooterNotes,
} from "@/lib/price-list";

function buildPriceListHtml(locale: "pl" | "ru"): string {
  const isRu = locale === "ru";
  const title = isRu ? "BESS MOTORS — Прайс-лист" : "BESS MOTORS — Cennik";
  const hourly = (isRu ? "Норма-час: " : "Norma-godzina: ") + `${HOURLY_RATE_PLN} zł/h`;
  const serviceCol = isRu ? "Услуга" : "Usługa";
  const priceCol = isRu ? "Цена" : "Cena";

  let body = "";
  for (const cat of priceCategories) {
    const items = priceListItems.filter((i) => i.categoryId === cat.id);
    if (!items.length) continue;
    body += `<h2 style="font-size:14px;margin:16px 0 8px;color:#e10600;">${isRu ? cat.nameRu : cat.namePl}</h2>`;
    body += `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">`;
    body += `<thead><tr style="background:#e10600;color:#fff;"><th style="padding:6px;text-align:left;">${serviceCol}</th><th style="padding:6px;text-align:right;">${priceCol}</th></tr></thead><tbody>`;
    for (const item of items) {
      const name = isRu ? item.nameRu : item.namePl;
      const from = item.priceFrom && item.unit !== "free" ? (isRu ? "от " : "od ") : "";
      let price = "";
      if (item.unit === "free") price = isRu ? "бесплатно" : "bezpłatnie";
      else if (item.unit === "per_cylinder")
        price = `${from}${item.basePrice} zł / ${isRu ? "цил." : "cyl."}`;
      else if (item.unit === "per_wheel")
        price = `${from}${item.basePrice} zł / ${isRu ? "кол." : "koło"}`;
      else if (item.unit === "per_100g") price = `${from}${item.basePrice} zł / 100g`;
      else price = `${from}${item.basePrice} zł`;
      body += `<tr style="border-bottom:1px solid #333;"><td style="padding:5px;">${name}</td><td style="padding:5px;text-align:right;color:#e10600;font-weight:bold;">${price}</td></tr>`;
    }
    body += `</tbody></table>`;
  }

  for (const note of priceListFooterNotes) {
    body += `<p style="font-size:9px;color:#888;margin:4px 0;">${isRu ? note.ru : note.pl}</p>`;
  }

  return `<style>@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&subset=latin,latin-ext&display=swap');</style>
  <div style="font-family:'Noto Sans','Segoe UI',Arial,sans-serif;background:#111;color:#fff;padding:24px;width:794px;">
    <h1 style="font-size:20px;margin:0 0 8px;color:#e10600;">${title}</h1>
    <p style="font-size:12px;margin:0 0 16px;color:#ccc;">${hourly}</p>
    ${body}
  </div>`;
}

export async function downloadPriceListPdf(locale: "pl" | "ru"): Promise<void> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.innerHTML = buildPriceListHtml(locale);
  document.body.appendChild(container);

  try {
    await document.fonts?.ready;
    await new Promise((r) => setTimeout(r, 400));
    const target = container.querySelector("div");
    if (!target) return;
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#111111",
      useCORS: true,
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(img, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(locale === "ru" ? "bess-motors-prajs.pdf" : "bess-motors-cennik.pdf");
  } finally {
    document.body.removeChild(container);
  }
}
