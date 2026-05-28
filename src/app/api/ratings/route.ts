import { NextRequest, NextResponse } from "next/server";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { ClientRating, Database } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const snap = await cloudGetCrmStore();
  const db = snap?.doc as Database | undefined;
  const ratings = (db?.clientRatings ?? [])
    .filter((r) => r.showOnSite && r.stars >= 4)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 24)
    .map((r) => ({
      id: r.id,
      stars: r.stars,
      comment: r.comment,
      clientName: r.clientName ? r.clientName.split(" ")[0] : "Klient",
      tag: r.tag,
      createdAt: r.createdAt,
    }));

  return NextResponse.json({ ok: true, ratings });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    stars?: number;
    comment?: string;
    workOrderId?: string;
    userId?: string;
    clientName?: string;
    source?: ClientRating["source"];
    tag?: string;
  };

  const stars = Math.round(Number(body.stars ?? 0));
  if (stars < 1 || stars > 5) {
    return NextResponse.json({ ok: false, error: "invalid_stars" }, { status: 400 });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const db = structuredClone(snap.doc) as Database;
  const rating: ClientRating = {
    id: `rating-${Date.now()}`,
    stars,
    comment: body.comment?.trim().slice(0, 500),
    workOrderId: body.workOrderId,
    userId: body.userId,
    clientName: body.clientName?.trim(),
    source: body.source ?? "site",
    tag: body.tag,
    showOnSite: stars >= 4,
    createdAt: new Date().toISOString(),
  };

  db.clientRatings = db.clientRatings ?? [];
  db.clientRatings.push(rating);

  if (body.workOrderId) {
    const order = db.workOrders.find((o) => o.id === body.workOrderId);
    if (order) {
      order.clientRating = {
        stars,
        comment: rating.comment,
        createdAt: rating.createdAt,
      };
    }
  }

  await cloudPutCrmStore(db);
  return NextResponse.json({ ok: true, id: rating.id });
}
