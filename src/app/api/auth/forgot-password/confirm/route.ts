import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { consumeResetToken } from "@/lib/server/password-reset-store";
import { isSmsConfigured } from "@/lib/server/sms";

/** Validates reset token before client updates local password */
export async function POST(req: Request) {
  if (!isSmsConfigured()) {
    return NextResponse.json({ ok: false, error: "sms_not_configured" }, { status: 503 });
  }

  let body: { phone?: string; resetToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  const resetToken = body.resetToken ?? "";
  if (!phone || !resetToken) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
  }

  const result = consumeResetToken(phone, resetToken);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
