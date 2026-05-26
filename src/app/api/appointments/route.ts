import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import type { Appointment } from "@/lib/store";
import {
  cloudListAppointmentsByPhone,
  cloudListAppointmentsForAdmin,
  cloudUpsertAppointment,
  isCloudAppointmentsEnabled,
} from "@/lib/server/appointments-cloud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function POST(req: Request) {
  if (!isCloudAppointmentsEnabled()) {
    return NextResponse.json(
      { ok: false, error: "cloud_disabled" },
      { status: 503 }
    );
  }

  let apt: Appointment;
  try {
    apt = (await req.json()) as Appointment;
    if (!apt?.id || !apt.date || !apt.time) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const result = await cloudUpsertAppointment(apt);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, status: result.status },
      { status: result.status === 401 ? 401 : 502 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  if (!isCloudAppointmentsEnabled()) {
    return NextResponse.json({ appointments: [], cloud: false });
  }

  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (session.role === "admin") {
    const appointments = await cloudListAppointmentsForAdmin();
    return NextResponse.json({ appointments, cloud: true });
  }

  if (session.role === "client" && session.phone) {
    const appointments = await cloudListAppointmentsByPhone(session.phone);
    return NextResponse.json({ appointments, cloud: true });
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}
