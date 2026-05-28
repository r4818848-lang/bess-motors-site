import { NextRequest, NextResponse } from "next/server";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { upsertAbandonedDraft } from "@/lib/abandoned-booking";
import type { Database } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: {
    phone?: string;
    name?: string;
    step?: string;
    serviceSummary?: string;
    date?: string;
    time?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const phone = (body.phone ?? "").trim();
  if (phone.length < 9) {
    return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: true, localOnly: true });
  }

  const db = structuredClone(snap.doc) as Database;
  upsertAbandonedDraft(db.settings, {
    phone,
    name: body.name,
    step: body.step ?? "unknown",
    serviceSummary: body.serviceSummary,
    date: body.date,
    time: body.time,
  });

  await cloudPutCrmStore(db);
  return NextResponse.json({ ok: true });
}
