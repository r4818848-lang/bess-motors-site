import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { generateResetCode } from "@/lib/server/password-crypto";
import {
  canResend,
  createResetSession,
} from "@/lib/server/password-reset-store";
import {
  buildResetMessage,
  isSmsConfigured,
  sendSms,
} from "@/lib/server/sms";

export async function POST(req: Request) {
  if (!isSmsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "sms_not_configured" },
      { status: 503 }
    );
  }

  let body: { phone?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json({ ok: false, error: "phone_required" }, { status: 400 });
  }

  if (!canResend(phone)) {
    return NextResponse.json(
      { ok: false, error: "rate_limit", resendInSec: 60 },
      { status: 429 }
    );
  }

  const locale = body.locale === "pl" ? "pl" : "ru";
  const code = generateResetCode();
  const message = buildResetMessage(code, locale);

  try {
    await sendSms(phone, message);
  } catch (e) {
    console.error("[reset/send]", e);
    return NextResponse.json(
      { ok: false, error: "sms_send_failed" },
      { status: 502 }
    );
  }

  createResetSession(phone, code);

  const masked = phone.slice(0, 4) + " *** " + phone.slice(-3);
  return NextResponse.json({
    ok: true,
    maskedPhone: masked,
    resendInSec: 60,
  });
}
