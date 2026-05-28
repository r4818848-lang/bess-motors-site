import type { User, Vehicle, WorkOrder } from "./store";
import { siteConfig } from "./site";

export async function downloadWarrantyCertificate(
  order: WorkOrder,
  vehicle: Vehicle,
  user: User
): Promise<void> {
  if (!order.warrantyUntil) return;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const html = `
    <div id="bm-warranty" style="font-family:Arial,sans-serif;padding:32px;max-width:600px;color:#111;">
      <h1 style="color:#e10600;margin:0 0 8px;">BESS MOTORS</h1>
      <p style="margin:0 0 24px;color:#666;">Karta gwarancyjna / Warranty card</p>
      <p><b>Klient:</b> ${user.name}</p>
      <p><b>Pojazd:</b> ${vehicle.make} ${vehicle.model} · ${vehicle.plate}</p>
      <p><b>Zlecenie:</b> ${order.number}</p>
      <p><b>Gwarancja do:</b> ${order.warrantyUntil}</p>
      <p style="margin-top:24px;font-size:12px;color:#666;">
        ${siteConfig.address} · ${siteConfig.phone}
      </p>
    </div>`;

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-9999px;top:0;";
  host.innerHTML = html;
  document.body.appendChild(host);

  const el = host.querySelector("#bm-warranty") as HTMLElement;
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#fff" });
  document.body.removeChild(host);

  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = (canvas.height * w) / canvas.width;
  pdf.addImage(img, "PNG", 0, 10, w, Math.min(h, 270));
  pdf.save(`gwarancja-${order.number}.pdf`);
}
