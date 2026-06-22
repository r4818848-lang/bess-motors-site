import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { extractTextFromImportFile } from "@/lib/server/extract-import-document-text";
import { parseWorkOrderImportText } from "@/lib/motowarsztat-import-parser";
import { createWorkOrderFromImport } from "@/lib/create-work-order-from-import";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import {
  bufferToImportDataUrl,
  importOrderExists,
  normalizeImportOrderKey,
  prepareImportDraft,
} from "@/lib/import-work-order-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

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

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

type BulkItemResult = {
  fileName: string;
  ok: boolean;
  orderNumber?: string;
  orderId?: string;
  error?: string;
  skipped?: boolean;
};

export async function POST(req: Request) {
  const auth = await requireStaff(req);
  if ("error" in auth && auth.error) return auth.error;

  try {
    const form = await req.formData();
    const entries = form
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (!entries.length) {
      return NextResponse.json({ error: "no_files" }, { status: 400 });
    }

    const results: BulkItemResult[] = [];

    for (let i = 0; i < entries.length; i++) {
      const file = entries[i]!;
      const fileName = file.name;
      const mime = file.type || "application/octet-stream";

      if (!ALLOWED.has(mime) && !mime.startsWith("image/")) {
        results.push({ fileName, ok: false, error: "unsupported_type" });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      let rawText = "";
      try {
        rawText = await extractTextFromImportFile(buffer, mime);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "parse_failed";
        results.push({ fileName, ok: false, error: msg });
        continue;
      }

      if (rawText.replace(/\s+/g, " ").trim().length < 8) {
        results.push({ fileName, ok: false, error: "no_text" });
        continue;
      }

      const parsed = parseWorkOrderImportText(rawText);
      const draft = prepareImportDraft(parsed, fileName, i + 1);
      const orderKey = normalizeImportOrderKey(draft.orderNumber, fileName);

      let itemResult: BulkItemResult = { fileName, ok: false };
      const put = await cloudMutateCrmStore(async (db) => {
        if (importOrderExists(db, orderKey)) {
          itemResult = {
            fileName,
            ok: true,
            skipped: true,
            orderNumber: orderKey,
            error: "already_exists",
          };
          return false;
        }

        const created = await createWorkOrderFromImport(db, {
          ...draft,
          attachment: {
            name: fileName,
            mime: mime.startsWith("image/") ? mime : "application/pdf",
            dataUrl: bufferToImportDataUrl(buffer, mime),
          },
        });

        if (!created.ok) {
          itemResult = { fileName, ok: false, error: created.error };
          return false;
        }

        itemResult = {
          fileName,
          ok: true,
          orderNumber: created.orderNumber,
          orderId: created.orderId,
        };
        return created.orderNumber;
      });

      if (!put.ok && !itemResult.error) {
        itemResult = { fileName, ok: false, error: put.error ?? "cloud_save_failed" };
      }

      results.push(itemResult);
    }

    const imported = results.filter((r) => r.ok && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.ok).length;

    return NextResponse.json({
      ok: failed === 0,
      imported,
      skipped,
      failed,
      results,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bulk_import_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
