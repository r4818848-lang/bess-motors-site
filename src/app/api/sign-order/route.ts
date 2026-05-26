import { NextResponse } from "next/server";
import type { OrderSignature } from "@/lib/store";
import {
  cloudAccessSignOrder,
  cloudSubmitWorkOrderSignature,
} from "@/lib/server/sign-order-cloud";
import { issueClientToken } from "@/lib/server/issue-client-token";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccessBody = {
  action: "access" | "verify";
  orderId?: string;
  phone: string;
  plate: string;
};

type SubmitBody = {
  action: "submit";
  orderId: string;
  phone: string;
  plate: string;
  signature: OrderSignature;
  clientSignature: string;
};

export async function POST(req: Request) {
  let body: AccessBody | SubmitBody;
  try {
    body = (await req.json()) as AccessBody | SubmitBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (!body?.phone || !body?.plate?.trim()) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (body.action === "access" || body.action === "verify") {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
    }

    const payload = await cloudAccessSignOrder(
      body.phone,
      body.plate,
      body.orderId
    );
    if (!payload) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const token = await issueClientToken(payload.client.id, payload.client.phone);

    return NextResponse.json({
      ok: true,
      token,
      order: payload.order,
      client: payload.client,
      vehicle: payload.vehicle,
      portal: payload.portal,
    });
  }

  if (body.action === "submit") {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
    }
    if (!body.orderId || !body.signature?.dataUrl || !body.clientSignature) {
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
