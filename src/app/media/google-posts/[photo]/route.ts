import { createCanvas, loadImage } from "@napi-rs/canvas";
import { NextResponse } from "next/server";

/**
 * Real owner-provided service photos, converted from the website's WebP
 * originals to JPG for Google Business Profile photo requirements.
 * No synthetic examples or overlays are added to the images.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const photoPaths: Record<string, string> = {
  "ambient-light.jpg": "/images/enhancements/ambient/ambient-08.webp",
  "wygłuszenie.jpg": "/images/enhancements/soundproofing/wyciszenie-02.webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ photo: string }> },
) {
  const { photo } = await context.params;
  const source = photoPaths[photo];
  if (!source) return new NextResponse("Not found", { status: 404 });

  try {
    const res = await fetch("https://www.bess-motors.com" + source, {
      cache: "force-cache",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error("Source image fetch failed");

    const img = await loadImage(Buffer.from(await res.arrayBuffer()));
    const width = 900;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Cover crop keeps the business photo, with no invented details or captions.
    const scale = Math.max(width / img.width, height / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);

    const jpeg = await canvas.encode("jpeg", 85);
    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Image temporarily unavailable", { status: 503 });
  }
}
