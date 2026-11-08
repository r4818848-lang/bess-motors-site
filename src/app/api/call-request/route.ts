import { NextResponse } from "next/server";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { notifyAdminTelegram } from "@/lib/server/admin-telegram";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { formatLeadMessage, normalizeSiteLocale, upsertWebsiteLead } from "@/lib/service-leads";
import type { ServiceLead } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeVin(raw: string | undefined): string {
  return (raw ?? "").replace(/\s/g, "").toUpperCase();
}

export async function POST(req: Request) {
  let body: {
    phone?: string;
    clientName?: string;
    serviceId?: string;
    serviceLabel?: string;
    comment?: string;
    vin?: string;
    vehicleLabel?: string;
    source?: string;
    siteLocale?: string;
    sourceUrl?: string;
    plate?: string;
    make?: string;
    model?: string;
    desiredDate?: string;
    desiredTime?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (phone.length < 9) {
    return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });
  }

  const clientName = (body.clientName ?? "Klient").trim() || "Klient";
  const serviceLabel = (body.serviceLabel ?? "Zapytanie ze strony").trim();
  const vin = normalizeVin(body.vin);
  const vehicleLabel = (body.vehicleLabel ?? "").trim();
  const baseComment = (body.comment ?? "").trim();

  // Ensure VIN / vehicle are always in CRM comment even if omitted from text
  const commentBits: string[] = [];
  if (vin.length === 17 && !baseComment.toUpperCase().includes(vin)) {
    commentBits.push(`VIN: ${vin}`);
  }
  if (vehicleLabel && !baseComment.toLowerCase().includes(vehicleLabel.toLowerCase())) {
    commentBits.push(`Auto: ${vehicleLabel}`);
  }
  if (baseComment) commentBits.push(baseComment);
  const comment = commentBits.join("\n");

  const source =
    body.source === "mini_quote"
      ? "mini_quote"
      : body.source === "vin_quote"
        ? "vin_quote"
        : body.source === "phone_only_booking"
          ? "phone_only_booking"
          : "website";

  const entry = {
    id: `call-${Date.now()}`,
    phone,
    clientName,
    userId: "guest",
    serviceId: body.serviceId ?? "diagnostic",
    serviceLabel,
    comment,
    status: "needs_call" as const,
    source: "website" as const,
    marketing:
      source === "mini_quote" ||
      source === "vin_quote" ||
      source === "phone_only_booking"
        ? { utmSource: source }
        : undefined,
    createdAt: new Date().toISOString(),
  };

  const savedLead: { current: ServiceLead | null } = { current: null };
  const put = await cloudMutateCrmStore((db) => {
    db.callRequests = db.callRequests ?? [];
    const recent = db.callRequests.some(
      (call) =>
        call.phone === phone &&
        call.serviceLabel === serviceLabel &&
        Date.now() - Date.parse(call.createdAt) < 2 * 60 * 1000
    );
    if (!recent) db.callRequests.push(entry);
    const saved = upsertWebsiteLead(db, {
      id: entry.id.replace(/^call-/, "lead-"),
      clientRequestId: entry.id,
      phone,
      name: clientName,
      make: body.make,
      model: body.model,
      plate: body.plate,
      vin,
      serviceId: body.serviceId,
      serviceLabel,
      desiredDate: body.desiredDate,
      desiredTime: body.desiredTime,
      siteLocale: normalizeSiteLocale(body.siteLocale),
      source,
      sourceUrl: body.sourceUrl,
    });
    savedLead.current = saved.lead;
  });
  if (!put.ok) {
    console.error("[call-request] CRM save failed", put.error);
    return NextResponse.json(
      { ok: false, error: put.error ?? "cloud_failed", cloud: false },
      { status: 502 }
    );
  }

  const lead = savedLead.current;
  const telegramOk = await notifyAdminTelegram(
    lead ? formatLeadMessage(lead) :
    [
      source === "vin_quote"
        ? "<b>Wyceń po VIN — nowe zapytanie</b>"
        : "<b>Nowe zapytanie ze strony</b>",
      `Tel: <b>${escapeHtml(phone)}</b>`,
      `Imię: <b>${escapeHtml(clientName)}</b>`,
      vin.length === 17 ? `VIN: <code>${escapeHtml(vin)}</code>` : "<i>VIN: brak</i>",
      vehicleLabel ? `Auto: <b>${escapeHtml(vehicleLabel)}</b>` : null,
      `Usługa: ${escapeHtml(serviceLabel)}`,
      source !== "website" ? `Źródło: ${escapeHtml(source)}` : null,
      comment ? `Opis:\n${escapeHtml(comment).slice(0, 800)}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  );
  if (telegramOk && lead) {
    const sentId = lead.id;
    await cloudMutateCrmStore((db) => {
      const row = (db.leads ?? []).find((item) => item.id === sentId);
      if (row) row.notifyStatus = "sent";
    });
  } else {
    console.warn("[call-request] telegram notify failed (check TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)");
  }

  return NextResponse.json({ ok: true, cloud: true, telegramOk });
}
