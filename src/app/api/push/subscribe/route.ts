import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { Database } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    const session = token ? await verifyToken(token) : null;
    if (!session || session.role !== "client") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      endpoint?: string;
      p256dh?: string;
      auth?: string;
    };
    if (!body.endpoint || !body.p256dh || !body.auth) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    const snap = await cloudGetCrmStore();
    if (!snap?.doc) {
      return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
    }

    const db = structuredClone(snap.doc) as Database;
    const user = db.users.find((u) => u.id === session.sub && u.role === "client");
    if (!user) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    user.pushSubscription = {
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth,
      updatedAt: new Date().toISOString(),
    };

    const put = await cloudPutCrmStore(db);
    if (!put.ok) {
      return NextResponse.json({ ok: false, error: put.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
