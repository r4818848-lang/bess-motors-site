import { NextResponse } from "next/server";
import type { OrderSignature } from "@/lib/store";
import {
  cloudSubmitWorkOrderSignature,
  cloudVerifySignOrder,
} from "@/lib/server/sign-order-cloud";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VerifyBody = {
  action: "verify";
  orderId: string;
  phone: string;
  plate?: string;
};

type SubmitBody = {
  action: "submit";
  orderId: string;
  phone: string;
  plate?: string;
  signature: OrderSignature;
  clientSignature: string;
};

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
  }

  let body: VerifyBody | SubmitBody;
  try {
    body = (await req.json()) as VerifyBody | SubmitBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (!body?.orderId || !body?.phone) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (body.action === "verify") {
    const payload = await cloudVerifySignOrder(body.orderId, body.phone, body.plate);
    if (!payload) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({
      ok: true,
      order: payload.order,
      client: payload.client,
      vehicle: payload.vehicle,
    });
  }

  if (body.action === "submit") {
    if (!body.signature?.dataUrl || !body.clientSignature) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    const ok = await cloudSubmitWorkOrderSignature(
      body.orderId,
      body.phone,
      body.plate,
      body.signature,
      body.clientSignature
    );
    if (!ok) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
}
