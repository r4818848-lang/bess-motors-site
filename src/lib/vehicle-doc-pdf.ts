import type { User, Vehicle, WorkOrder } from "./store";

async function renderPdf(html: string, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-9999px;top:0;";
  host.innerHTML = html;
  document.body.appendChild(host);
  const el = host.firstElementChild as HTMLElement;
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#fff" });
  document.body.removeChild(host);
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = (canvas.height * w) / canvas.width;
  pdf.addImage(img, "PNG", 0, 10, w, Math.min(h, 270));
  pdf.save(filename);
}

export async function downloadReceptionAct(
  order: WorkOrder,
  vehicle: Vehicle,
  user: User
): Promise<void> {
  const html = `<div style="font-family:Arial;padding:32px;color:#111;">
    <h1 style="color:#e10600;">BESS MOTORS — Protokół przyjęcia</h1>
    <p><b>WZ:</b> ${order.number}</p>
    <p><b>Klient:</b> ${user.name} · ${user.phone}</p>
    <p><b>Pojazd:</b> ${vehicle.make} ${vehicle.model} · ${vehicle.plate}</p>
    <p><b>Data:</b> ${new Date().toISOString().slice(0, 10)}</p>
    <p style="margin-top:24px;font-size:12px;color:#666;">Podpis klienta: ___________________</p>
  </div>`;
  await renderPdf(html, `przyjecie-${order.number}.pdf`);
}

export async function downloadDeliveryAct(
  order: WorkOrder,
  vehicle: Vehicle,
  user: User
): Promise<void> {
  const html = `<div style="font-family:Arial;padding:32px;color:#111;">
    <h1 style="color:#e10600;">BESS MOTORS — Protokół wydania</h1>
    <p><b>WZ:</b> ${order.number}</p>
    <p><b>Klient:</b> ${user.name}</p>
    <p><b>Pojazd:</b> ${vehicle.make} ${vehicle.model} · ${vehicle.plate}</p>
    <p><b>Status:</b> wydano</p>
    <p style="margin-top:24px;font-size:12px;">Podpis odbioru: ___________________</p>
  </div>`;
  await renderPdf(html, `wydanie-${order.number}.pdf`);
}
