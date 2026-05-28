import { NextRequest, NextResponse } from "next/server";
import { resolveExtraWorkApproval } from "@/lib/server/telegram-bot/extra-work-approval";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { orderId?: string; approved?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.orderId || typeof body.approved !== "boolean") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const result = await resolveExtraWorkApproval(body.orderId, body.approved);
  return NextResponse.json({ ok: result.ok });
}
