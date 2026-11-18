import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { parseVerifiedAcquisition } from "@/lib/verified-acquisition";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7).trim() || null : null;
}

/**
 * Operator explicitly reviews a named existing CRM order and, optionally,
 * an existing lead. No auto-join by phone, name, vehicle plate, or message text.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const session = await verifyToken(token);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw Error("bad");
    body = raw as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  if (!orderId || orderId.length > 128 || body.manuallyConfirmed !== true) {
    return NextResponse.json({ error: "confirmation_required" }, { status: 422 });
  }
  const clear = body.clear === true;
  if (clear && body.clearConfirmed !== true) {
    return NextResponse.json({ error: "clear_confirmation_required" }, { status: 422 });
  }
  const now = new Date().toISOString();
  let validationError = "";

  const result = await cloudMutateCrmStore((db) => {
    const order = db.workOrders.find(x => x.id === orderId);
    if (!order) return false;

    if (clear) {
      delete order.verifiedAcquisition;
    } else {
      const parsed = parseVerifiedAcquisition(body, db, now);
      if (!parsed) {
        validationError = "invalid_attribution";
        return false;
      }
      // Prevent silently attributing a lead that the CRM already links to a
      // different work order via its appointment.
      if (parsed.leadId) {
        const lead = db.leads.find(x => x.id === parsed.leadId);
        if (lead?.appointmentId) {
          const appointment = db.appointments.find(x => x.id === lead.appointmentId);
          if (appointment?.workOrderId && appointment.workOrderId !== order.id) {
            validationError = "lead_belongs_to_other_order";
            return false;
          }
        }
      }
      order.verifiedAcquisition = parsed;
    }
    order.updatedAt = now;
    order.auditLog = [
      ...(order.auditLog ?? []).slice(-99),
      {
        at: now,
        field: "verifiedAcquisition",
        from: clear ? "manual_reset" : "operator_review",
        to: clear ? "cleared" : String(body.channel) + "/" + String(body.nature),
      },
    ];
    return order.number;
  }, { skipAutomation: true });

  if (validationError) return NextResponse.json({ error: validationError }, { status: 422 });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "cloud_save_failed" },
      { status: result.error === "not_found" ? 404 : result.error === "cloud_empty" ? 503 : 409 }
    );
  }
  return NextResponse.json({ ok: true, orderNumber: result.result, savedAt: now });
}
