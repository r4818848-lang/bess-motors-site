import { NextResponse } from "next/server";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESOURCES = [
  { id: "lift-1", kind: "lift", confirmed: false },
  { id: "lift-2", kind: "lift", confirmed: false },
  { id: "tyre-1", kind: "tyre_machine", confirmed: false },
  { id: "balancer-1", kind: "balancer", confirmed: false },
  { id: "ac-1", kind: "ac_station", confirmed: false },
  { id: "diag-1", kind: "diagnostic_device", confirmed: false },
];

export async function GET(req: Request) {
  const actor = await guardScheduler(req);
  if (isGuardError(actor)) return actor;
  return NextResponse.json({
    ok: true,
    persisted: false,
    price: null,
    confirmed: false,
    resources: RESOURCES,
    note: "Ресурсы не включены в AUTO, пока владелец не подтвердит, что они есть и свободны.",
  });
}
