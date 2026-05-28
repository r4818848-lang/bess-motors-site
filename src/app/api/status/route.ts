import { NextRequest, NextResponse } from "next/server";
import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { repairProgressPercent } from "@/lib/repair-progress";
import { getQueuePosition } from "@/lib/queue-position";
import type { Database, RepairStatus, WorkOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<RepairStatus, { pl: string; ru: string; en: string }> = {
  received: { pl: "Przyjęty", ru: "Принят", en: "Received" },
  diagnostic: { pl: "Diagnostyka", ru: "Диагностика", en: "Diagnostics" },
  repair: { pl: "Naprawa", ru: "Ремонт", en: "In repair" },
  waitingParts: { pl: "Czeka na części", ru: "Ожидание запчастей", en: "Waiting for parts" },
  ready: { pl: "Gotowy", ru: "Готов", en: "Ready" },
  delivered: { pl: "Wydany", ru: "Выдан", en: "Delivered" },
};

function findClient(db: Database, phone: string, plate: string) {
  const phoneKey = normalizePhone(phone);
  const plateKey = normalizePlateKey(plate);
  if (!phoneKey || plateKey.length < 2) return null;

  const user = db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === phoneKey
  );
  if (!user) return null;

  const vehicle = db.vehicles.find(
    (v) => v.userId === user.id && normalizePlateKey(v.plate) === plateKey
  );
  if (!vehicle) return null;

  const orders = db.workOrders
    .filter((o) => o.userId === user.id && o.vehicleId === vehicle.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const active =
    orders.find((o) => o.status !== "delivered") ?? orders[0] ?? null;

  return { user, vehicle, active, ordersCount: orders.length };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { clientIp, rateLimit } = await import("@/lib/api-rate-limit");
  if (!rateLimit(clientIp(req), 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limit" }, { status: 429 });
  }

  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const plate = req.nextUrl.searchParams.get("plate") ?? "";
  const locale = req.nextUrl.searchParams.get("locale") ?? "pl";

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const db = snap.doc as Database;
  const hit = findClient(db, phone, plate);
  if (!hit?.active) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const o: WorkOrder = hit.active;
  const lang = locale === "ru" || locale === "uk" ? "ru" : locale === "en" ? "en" : "pl";
  const label = STATUS_LABELS[o.status][lang];
  const queue = getQueuePosition(db, o);
  const partsLabels = {
    ordered: { pl: "Części zamówione", ru: "Запчасти заказаны", en: "Parts ordered" },
    in_transit: { pl: "Części w drodze", ru: "Запчасти в пути", en: "Parts in transit" },
    arrived: { pl: "Części na miejscu", ru: "Запчасти на месте", en: "Parts arrived" },
  };
  const partsLabel = o.clientPartsStatus
    ? partsLabels[o.clientPartsStatus][lang]
    : null;

  return NextResponse.json({
    ok: true,
    number: o.number,
    status: o.status,
    statusLabel: label,
    progressPercent: repairProgressPercent(o.status),
    needsSign:
      o.confirmationStatus !== "confirmed" ||
      o.documentStatus === "awaiting_signature",
    paymentStatus: o.paymentStatus ?? "unpaid",
    clientPartsStatus: o.clientPartsStatus ?? null,
    clientPartsStatusLabel: partsLabel,
    queuePosition: queue?.position ?? null,
    queueTotal: queue?.total ?? null,
    vehicle: {
      make: hit.vehicle.make,
      model: hit.vehicle.model,
      plate: hit.vehicle.plate,
    },
    ordersCount: hit.ordersCount,
  });
}
