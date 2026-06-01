import { NextRequest, NextResponse } from "next/server";
import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { repairProgressPercent } from "@/lib/repair-progress";
import { getQueuePosition } from "@/lib/queue-position";
import { orderNeedsClientSignature } from "@/lib/order-signature";
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

function orderMatchesPlate(db: Database, order: WorkOrder, plateKey: string): boolean {
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  return !!vehicle && normalizePlateKey(vehicle.plate) === plateKey;
}

function findClient(db: Database, phone: string, plate: string) {
  const phoneKey = normalizePhone(phone);
  const plateKey = normalizePlateKey(plate);
  if (!phoneKey || plateKey.length < 2) return null;

  const user = db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === phoneKey
  );
  if (!user) return null;

  const userOrders = db.workOrders
    .filter((o) => o.userId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  let matched = userOrders.filter((o) => orderMatchesPlate(db, o, plateKey));
  const aptMatch = db.appointments.some(
    (a) =>
      a.userId === user.id &&
      normalizePlateKey(a.clientPlate ?? "") === plateKey
  );
  if (matched.length === 0 && aptMatch) {
    matched = userOrders;
  }
  if (matched.length === 0) return null;

  const active = matched.find((o) => o.status !== "delivered") ?? null;
  const vehicle =
    db.vehicles.find((v) => v.userId === user.id && normalizePlateKey(v.plate) === plateKey) ??
    db.vehicles.find((v) => v.id === (active ?? matched[0])!.vehicleId) ??
    null;

  return {
    user,
    vehicle,
    active,
    ordersCount: matched.length,
    noActive: !active,
  };
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
  if (!hit) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (hit.noActive || !hit.active) {
    return NextResponse.json({ ok: false, error: "no_active" }, { status: 404 });
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

  const v = hit.vehicle;

  return NextResponse.json({
    ok: true,
    orderId: o.id,
    number: o.number,
    status: o.status,
    statusLabel: label,
    progressPercent: repairProgressPercent(o.status),
    needsSign: orderNeedsClientSignature(o),
    paymentStatus: o.paymentStatus ?? "unpaid",
    clientPartsStatus: o.clientPartsStatus ?? null,
    clientPartsStatusLabel: partsLabel,
    queuePosition: queue?.position ?? null,
    queueTotal: queue?.total ?? null,
    vehicle: {
      make: v?.make ?? "",
      model: v?.model ?? "",
      plate: v?.plate ?? plate,
    },
    ordersCount: hit.ordersCount,
  });
}
