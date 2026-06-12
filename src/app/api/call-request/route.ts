import { NextResponse } from "next/server";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { notifyAdminTelegram } from "@/lib/server/admin-telegram";
import { normalizePhone } from "@/lib/server/normalize-phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  let body: {
    phone?: string;
    clientName?: string;
    serviceId?: string;
    serviceLabel?: string;
    comment?: string;
    source?: string;
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
  const comment = (body.comment ?? "").trim();
  const source = body.source === "mini_quote" ? "mini_quote" : "website";

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
    marketing: source === "mini_quote" ? { utmSource: "mini_quote" } : undefined,
    createdAt: new Date().toISOString(),
  };

  const put = await cloudMutateCrmStore((db) => {
    db.callRequests = db.callRequests ?? [];
    db.callRequests.push(entry);
  });
  if (!put.ok) {
    console.error("[call-request] CRM save failed", put.error);
    return NextResponse.json(
      { ok: false, error: put.error ?? "cloud_failed", cloud: false },
      { status: 502 }
    );
  }

  await notifyAdminTelegram(
    [
      "<b>Nowe zapytanie ze strony</b>",
      `Tel: <b>${escapeHtml(phone)}</b>`,
      `Imię: <b>${escapeHtml(clientName)}</b>`,
      `Usługa: ${escapeHtml(serviceLabel)}`,
      comment ? `Opis: ${escapeHtml(comment).slice(0, 500)}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return NextResponse.json({ ok: true, cloud: true });
}
