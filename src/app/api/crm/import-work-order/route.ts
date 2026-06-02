import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { extractTextFromImportFile } from "@/lib/server/extract-import-document-text";
import { parseWorkOrderImportText } from "@/lib/motowarsztat-import-parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function POST(req: Request) {
  const auth = await requireStaff(req);
  if ("error" in auth && auth.error) return auth.error;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime) && !mime.startsWith("image/")) {
      return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromImportFile(buffer, mime);
    const trimmed = rawText.replace(/\s+/g, " ").trim();

    if (trimmed.length < 8) {
      return NextResponse.json(
        {
          error: "no_text",
          hint: "PDF bez tekstu lub złe zdjęcie — spróbuj wyraźniejszego skanu",
        },
        { status: 422 }
      );
    }

    const parsed = parseWorkOrderImportText(rawText);

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      mime,
      rawTextPreview: rawText.slice(0, 4000),
      parsed,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "parse_failed";
    const status =
      msg === "file_too_large" ? 413 : msg === "unsupported_type" ? 400 : 500;
    const hint =
      /dommatrix|canvas|pdf-parse/i.test(msg)
        ? "Błąd odczytu PDF na serwerze — spróbuj zdjęcia (JPG) lub ponów za chwilę"
        : undefined;
    return NextResponse.json({ error: msg, hint }, { status });
  }
}
