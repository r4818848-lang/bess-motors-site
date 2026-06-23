import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { createWorkOrderFromImport } from "@/lib/create-work-order-from-import";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import {
  bufferToImportDataUrl,
  importOrderExists,
  normalizeImportOrderKey,
} from "@/lib/import-work-order-helpers";
import type { ImportWorkOrderDraft } from "@/lib/motowarsztat-import-parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_ATTACHMENT_BYTES = 4_500_000;

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

async function requireStaff(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const session = await verifyToken(token);
  if (!session || (session.role !== "admin" && session.role !== "mechanic")) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function POST(req: Request) {
  const auth = await requireStaff(req);
  if ("error" in auth && auth.error) return auth.error;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const draftRaw = form.get("draft");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }
    if (typeof draftRaw !== "string" || !draftRaw.trim()) {
      return NextResponse.json({ error: "no_draft" }, { status: 400 });
    }

    let draft: ImportWorkOrderDraft;
    try {
      draft = JSON.parse(draftRaw) as ImportWorkOrderDraft;
    } catch {
      return NextResponse.json({ error: "invalid_draft" }, { status: 400 });
    }

    if (!draft.phone?.trim()) {
      return NextResponse.json({ error: "phone_required" }, { status: 422 });
    }

    const fileName = file.name || "import.pdf";
    const mime = file.type || "application/octet-stream";
    const orderKey = normalizeImportOrderKey(draft.orderNumber, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    let attachment: { name: string; mime: string; dataUrl: string } | undefined;
    if (buffer.length > 0 && buffer.length <= MAX_ATTACHMENT_BYTES) {
      attachment = {
        name: fileName,
        mime: mime.startsWith("image/") ? mime : mime || "application/pdf",
        dataUrl: bufferToImportDataUrl(buffer, mime || "application/pdf"),
      };
    }

    draft.internalNotes = [draft.internalNotes, "Импорт: CRM"].filter(Boolean).join("\n");

    let orderId = "";
    let orderNumber = "";
    let createError = "";

    const put = await cloudMutateCrmStore(async (db) => {
      if (importOrderExists(db, orderKey)) {
        createError = "already_exists";
        return false;
      }

      const created = await createWorkOrderFromImport(db, { ...draft, attachment });
      if (!created.ok) {
        createError = created.error;
        return false;
      }

      orderId = created.orderId;
      orderNumber = created.orderNumber;
      return created.orderNumber;
    });

    if (createError === "already_exists") {
      return NextResponse.json({ error: "already_exists", orderNumber: orderKey }, { status: 409 });
    }
    if (createError) {
      return NextResponse.json({ error: createError }, { status: 422 });
    }
    if (!put.ok) {
      return NextResponse.json(
        { error: put.error ?? "cloud_save_failed" },
        { status: put.error === "cloud_empty" ? 503 : 502 }
      );
    }

    return NextResponse.json({ ok: true, orderId, orderNumber });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
