import { createCanvas, loadImage } from "@napi-rs/canvas";

const MIN_USEFUL_OCR_LEN = 120;

/** Upscale + white background for phone screenshots / Telegram JPEG. */
export async function preprocessImageForOcr(buffer: Buffer): Promise<Buffer> {
  const img = await loadImage(buffer);
  const maxSide = Math.max(img.width, img.height);
  const scale = Math.min(3, Math.max(1.75, 2400 / maxSide));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toBuffer("image/png");
}

function ocrQualityScore(text: string): number {
  const t = text.trim();
  if (!t.length) return 0;
  const lower = t.toLowerCase();
  let score = Math.min(t.length, 800);
  if (lower.includes("kosztorys")) score += 400;
  if (lower.includes("dane klienta") || lower.includes("dane kienta")) score += 300;
  if (lower.includes("usługi") || lower.includes("uslugi")) score += 200;
  if (lower.includes("towary")) score += 200;
  if (lower.includes("задач") || lower.includes("zadach") || lower.includes("товар"))
    score += 250;
  if (/\bzl\s*\d/i.test(t) || lower.includes("zł")) score += 150;
  if (/\b\d{9}\b/.test(t)) score += 100;
  if (/[A-HJ-NPR-Z0-9]{17}/i.test(t)) score += 100;
  const letters = (t.match(/[a-ząćęłńóśźż]/gi) ?? []).length;
  score += letters * 0.5;
  const garbage = (t.match(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s.,:;+\-()/|@#%°łŁzłZŁ]/g) ?? []).length;
  score -= garbage * 2;
  return score;
}

/** Best-effort OCR for workshop estimate screenshots. */
export async function ocrImportImageBuffer(buffer: Buffer): Promise<string> {
  const { createWorker, PSM } = await import("tesseract.js");
  let preprocessed: Buffer;
  try {
    preprocessed = await preprocessImageForOcr(buffer);
  } catch {
    preprocessed = buffer;
  }

  const worker = await createWorker("pol+eng", undefined, { logger: () => {} });
  try {
    const attempts: { buf: Buffer; psm: (typeof PSM)[keyof typeof PSM] }[] = [
      { buf: preprocessed, psm: PSM.AUTO },
      { buf: preprocessed, psm: PSM.SINGLE_BLOCK },
      { buf: buffer, psm: PSM.AUTO },
    ];

    let best = "";
    let bestScore = 0;
    for (const a of attempts) {
      await worker.setParameters({ tessedit_pageseg_mode: a.psm });
      const result = await worker.recognize(a.buf);
      const text = result.data.text ?? "";
      const score = ocrQualityScore(text);
      if (score > bestScore) {
        bestScore = score;
        best = text;
      }
    }
    return best;
  } finally {
    await worker.terminate();
  }
}

export function isOcrTextLikelyUseful(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_USEFUL_OCR_LEN) return false;
  return ocrQualityScore(t) >= 280;
}
