import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { extractTextFromImportFile } from "@/lib/server/extract-import-document-text";
import { isOcrTextLikelyUseful } from "@/lib/server/ocr-import-image";
import { parseMotowarsztatCrmScreenshotText } from "@/lib/motowarsztat-crm-screenshot-parser";
import {
  enrichWorkOrderFromScreenshot,
  findWorkOrderByNumber,
} from "@/lib/enrich-work-order-from-screenshot";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import type { AttachedFile, Database } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

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

function bufferToDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function POST(req: Request) {
  const auth = await requireStaff(req);
  if ("error" in auth && auth.error) return auth.error;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const orderId = String(form.get("orderId") ?? "").trim();
    const apply = form.get("apply") === "true";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }

    const mime = file.type || "image/png";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "image_required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromImportFile(buffer, mime);
    const snapshot = parseMotowarsztatCrmScreenshotText(rawText);

    if (
      !snapshot.orderNumber &&
      !isOcrTextLikelyUseful(rawText) &&
      rawText.trim().length < 40
    ) {
      return NextResponse.json(
        { error: "ocr_low_quality", rawTextPreview: rawText.slice(0, 800) },
        { status: 422 }
      );
    }

    if (!snapshot.orderNumber) {
      return NextResponse.json(
        {
          error: "no_order_number",
          rawTextPreview: rawText.slice(0, 1500),
        },
        { status: 422 }
      );
    }

    if (!apply) {
      return NextResponse.json({
        ok: true,
        preview: true,
        snapshot,
        rawTextPreview: rawText.slice(0, 2000),
      });
    }

    let enrichResult: ReturnType<typeof enrichWorkOrderFromScreenshot> | null = null;
    const attachment: AttachedFile = {
      id: `f-enrich-${Date.now()}`,
      name: file.name || "crm-screenshot.png",
      type: "image",
      category: "document",
      dataUrl: bufferToDataUrl(buffer, mime),
      uploadedAt: new Date().toISOString(),
    };

    const put = await cloudMutateCrmStore(async (db: Database) => {
      const order =
        (orderId ? db.workOrders.find((o) => o.id === orderId) : undefined) ??
        findWorkOrderByNumber(db, snapshot.orderNumber);

      if (!order) return false;

      const vatRate = db.settings.vatRate ?? 23;
      enrichResult = enrichWorkOrderFromScreenshot(order, snapshot, vatRate);

      const already = order.files.some((f) => f.name === attachment.name);
      if (!already) {
        order.files.push(attachment);
      }

      order.updatedAt = new Date().toISOString();
      return order.number;
    });

    if (!put.ok || !enrichResult) {
      return NextResponse.json(
        { error: put.error ?? "order_not_found", snapshot },
        { status: put.error === "not_found" ? 404 : 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      applied: true,
      result: enrichResult,
      rawTextPreview: rawText.slice(0, 1500),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "enrich_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
