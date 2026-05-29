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

  // Admin notification should never block booking flow, but must be observable in logs
  const telegramOk = await notifyAdminTelegram(
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
  if (!telegramOk) {
    console.warn("[telegram] notify failed (check TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)");
  }

  try {
    const { cloudGetCrmStore, cloudPutCrmStore } = await import("@/lib/server/crm-cloud");
    const { runCrmAutomation } = await import("@/lib/crm-automation");
    const snap = await cloudGetCrmStore();
    if (snap?.doc) {
      const db = structuredClone(snap.doc) as import("@/lib/store").Database;
      const { ensureClientCredentialsForBooking } = await import(
        "@/lib/create-work-order-from-booking"
      );
      const { userId, vehicleId } = await ensureClientCredentialsForBooking(
        db,
        apt.clientName ?? "—",
        apt.clientPhone ?? "",
        apt.clientPlate,
        apt.userId
      );
      apt.userId = userId;
      apt.vehicleId = vehicleId;

      const idx = db.appointments.findIndex((a) => a.id === apt.id);
      if (idx >= 0) db.appointments[idx] = apt;
      else db.appointments.push(apt);
      runCrmAutomation(db, snap.doc as import("@/lib/store").Database);
      await cloudPutCrmStore(db);
      const user = db.users.find((u) => u.id === apt.userId);
      if (user?.pushSubscription?.endpoint) {
        const { sendWebPushToUser } = await import("@/lib/server/web-push-send");
        await sendWebPushToUser(user, {
          title: "BESS MOTORS",
          body: `Zapisano wizytę: ${apt.date} ${apt.time}`,
          url: "/cabinet",
        });
      }
    }
  } catch (e) {
    console.warn("[crm] auto-sync appointment failed", e);
  }

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
