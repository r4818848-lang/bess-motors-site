import { NextResponse } from "next/server";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { notifyAdminTelegram } from "@/lib/server/admin-telegram";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { acceptWebsiteInquiry, completeLeadNotice, formatLeadMessage, normalizeSiteLocale } from "@/lib/service-leads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    clientRequestId?: string;
    siteLocale?: string;
    sourceUrl?: string;
    plate?: string;
    make?: string;
    model?: string;
    desiredDate?: string;
    desiredTime?: string;
    services?: { id?: string; label?: string; quantity?: number }[];
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

  const requestedSource = (body.source ?? "website").trim().toLowerCase();
  const source = /^[a-z0-9_-]{1,40}$/.test(requestedSource) ? requestedSource : "website";

  const saved: { leadId: string | null } = { leadId: null };
  const put = await cloudMutateCrmStore((db) => {
    const accepted = acceptWebsiteInquiry(db, {
      clientRequestId: (body.clientRequestId ?? "").trim() || undefined,
      phone,
      name: clientName,
      make: body.make || vehicleLabel,
      model: body.model,
      plate: body.plate,
      vin: vin.length === 17 ? vin : "",
      serviceId: body.serviceId,
      serviceLabel,
      services: Array.isArray(body.services) ? body.services : undefined,
      desiredDate: body.desiredDate,
      desiredTime: body.desiredTime,
      siteLocale: normalizeSiteLocale(body.siteLocale),
      source,
      sourceUrl: body.sourceUrl,
      comment,
    });
    saved.leadId = accepted.lead.id;
    return accepted.decision;
  });
  if (!put.ok) {
    console.error("[call-request] CRM save failed", put.error);
    return NextResponse.json(
      { ok: false, error: put.error ?? "cloud_failed", cloud: false },
      { status: 502 }
    );
  }

  let telegramOk = false;
  if (put.result === "send" && saved.leadId) {
    const leadId = saved.leadId;
    const { cloudGetCrmStore } = await import("@/lib/server/crm-cloud");
    const snap = await cloudGetCrmStore();
    const lead = snap?.doc?.leads?.find((item) => item.id === leadId);
    telegramOk = await notifyAdminTelegram(lead ? formatLeadMessage(lead) : `<b>Новая заявка</b>\nID: <code>${leadId}</code>`);
    await cloudMutateCrmStore((db) => {
      const row = (db.leads ?? []).find((item) => item.id === leadId);
      if (row) completeLeadNotice(row, telegramOk, new Date());
    }, { skipAutomation: true });
    if (!telegramOk) {
      console.warn("[call-request] telegram notify failed (check TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)");
    }
  }

  return NextResponse.json({ ok: true, cloud: true, telegramOk, duplicate: put.result !== "send" });
}
