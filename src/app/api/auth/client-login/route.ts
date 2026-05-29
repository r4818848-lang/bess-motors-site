import { NextResponse } from "next/server";
import { cloudClientCabinetLogin } from "@/lib/server/client-login-cloud";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
  }

  let body: { phone?: string; plate?: string };
  try {
    body = (await req.json()) as { phone?: string; plate?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const phone = body.phone?.trim() ?? "";
  const plate = body.plate?.trim() ?? "";
  if (!phone || !plate) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const result = await cloudClientCabinetLogin(phone, plate);
  if (!result) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    token: result.token,
    portal: result.portal,
    user: {
      id: result.user.id,
      phone: result.user.phone,
      name: result.user.name,
      role: result.user.role,
    },
  });
}
