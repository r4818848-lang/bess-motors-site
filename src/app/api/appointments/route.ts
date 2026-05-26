import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import type { Appointment } from "@/lib/store";
import { notifyAdminTelegram } from "@/lib/server/admin-telegram";
import {
  cloudDeleteAppointment,
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

  // Fire-and-forget admin notification (should not block booking flow)
  void notifyAdminTelegram(
    [
      "<b>Новая онлайн-запись</b>",
      `Дата: <b>${apt.date}</b> ${apt.time}`,
      apt.clientName ? `Имя: <b>${escapeHtml(apt.clientName)}</b>` : null,
      apt.clientPhone ? `Телефон: <b>${escapeHtml(apt.clientPhone)}</b>` : null,
      apt.comment ? `Комментарий: ${escapeHtml(apt.comment).slice(0, 500)}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

export async function DELETE(req: Request) {
  if (!isCloudAppointmentsEnabled()) {
    return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
  }

  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin_only" }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const result = await cloudDeleteAppointment(id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status === 401 ? 401 : 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
