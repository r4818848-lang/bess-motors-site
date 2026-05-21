import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { verifyResetCode } from "@/lib/server/password-reset-store";
import { isSmsConfigured } from "@/lib/server/sms";

export async function POST(req: Request) {
  if (!isSmsConfigured()) {
    return NextResponse.json({ ok: false, error: "sms_not_configured" }, { status: 503 });
  }

  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  const code = String(body.code ?? "").replace(/\D/g, "").slice(0, 6);
  if (!phone || code.length !== 6) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const result = verifyResetCode(phone, code);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, resetToken: result.resetToken });
}
