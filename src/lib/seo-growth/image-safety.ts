import { createCanvas, loadImage } from "@napi-rs/canvas";

const MAX_BYTES = 4 * 1024 * 1024;
const MIN_SIDE = 32;
const MAX_SIDE = 8000;
const OUTPUT_SIDE = 2000;

export type SafeImage = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  bytes: Uint8Array;
};

export type ImageCheck = { ok: true; image: SafeImage } | { ok: false; reason: string };

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  return sig.every((value, index) => bytes[index] === value);
}

function stripJpeg(bytes: Uint8Array): Uint8Array | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const parts: Uint8Array[] = [bytes.slice(0, 2)];
  let i = 2;
  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === 0xd9) {
      parts.push(bytes.slice(i, i + 2));
      break;
    }
    if (marker === 0xda) {
      parts.push(bytes.slice(i));
      break;
    }
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(bytes.slice(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 3 >= bytes.length) return null;
    const length = (bytes[i + 2] << 8) + bytes[i + 3];
    if (length < 2 || i + 2 + length > bytes.length) return null;
    const dropExif = marker === 0xe1 || marker === 0xed;
    if (!dropExif) parts.push(bytes.slice(i, i + 2 + length));
    i += 2 + length;
  }
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function stripPng(bytes: Uint8Array): Uint8Array | null {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!startsWith(bytes, sig)) return null;
  const parts: Uint8Array[] = [bytes.slice(0, 8)];
  let i = 8;
  while (i + 8 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + i, 4).getUint32(0);
    const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
    const chunkEnd = i + 12 + length;
    if (chunkEnd > bytes.length) return null;
    const drop = type === "eXIf" || type === "tEXt" || type === "zTXt" || type === "iTXt";
    if (!drop) parts.push(bytes.slice(i, chunkEnd));
    i = chunkEnd;
    if (type === "IEND") break;
  }
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function stripWebp(bytes: Uint8Array): Uint8Array | null {
  if (String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF") return null;
  if (String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") return null;
  const parts: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= bytes.length) {
    const type = String.fromCharCode(...bytes.slice(i, i + 4));
    const length = bytes[i + 4] + (bytes[i + 5] << 8) + (bytes[i + 6] << 16) + (bytes[i + 7] << 24);
    const padded = length + (length % 2);
    const end = i + 8 + padded;
    if (end > bytes.length) return null;
    if (type !== "EXIF") parts.push(bytes.slice(i, end));
    i = end;
  }
  const payload = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(12 + payload);
  out.set([82, 73, 70, 70], 0);
  new DataView(out.buffer).setUint32(4, 4 + payload, true);
  out.set([87, 69, 66, 80], 8);
  let offset = 12;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function inspectImage(bytes: Uint8Array): ImageCheck {
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > MAX_BYTES) return { ok: false, reason: "too_large" };
  const head = String.fromCharCode(...bytes.slice(0, 32)).toLowerCase();
  if (head.includes("<svg") || head.includes("<html") || head.includes("<?xml") || head.includes("<script")) {
    return { ok: false, reason: "not_an_image" };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const cleaned = stripJpeg(bytes);
    if (!cleaned) return { ok: false, reason: "invalid_jpeg" };
    return { ok: true, image: { mime: "image/jpeg", bytes: cleaned } };
  }
  if (startsWith(bytes, [137, 80, 78, 71, 13, 10, 26, 10])) {
    const cleaned = stripPng(bytes);
    if (!cleaned) return { ok: false, reason: "invalid_png" };
    return { ok: true, image: { mime: "image/png", bytes: cleaned } };
  }
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    const cleaned = stripWebp(bytes);
    if (!cleaned) return { ok: false, reason: "invalid_webp" };
    return { ok: true, image: { mime: "image/webp", bytes: cleaned } };
  }
  return { ok: false, reason: "unsupported_type" };
}

export function imageContainsExif(bytes: Uint8Array): boolean {
  const text = Buffer.from(bytes).toString("latin1");
  return text.includes("Exif") || text.includes("eXIf");
}

function hasDecodablePayload(bytes: Uint8Array, mime: SafeImage["mime"]): boolean {
  if (mime === "image/png") return Buffer.from(bytes).includes(Buffer.from("IDAT"));
  if (mime === "image/webp") {
    const text = Buffer.from(bytes).toString("latin1");
    return text.includes("VP8 ") || text.includes("VP8L") || text.includes("VP8X");
  }
  let i = 2;
  let sawFrame = false;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) return false;
    const marker = bytes[i + 1];
    if (marker === 0xda) return sawFrame && bytes.length - i > 8;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) sawFrame = true;
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const length = (bytes[i + 2] << 8) + bytes[i + 3];
    if (length < 2 || i + 2 + length > bytes.length) return false;
    i += 2 + length;
  }
  return false;
}

/** Decode and write a new JPEG. Metadata from the original file is not copied. */
export async function prepareCaseImage(bytes: Uint8Array): Promise<ImageCheck> {
  const checked = inspectImage(bytes);
  if (!checked.ok) return checked;
  if (!hasDecodablePayload(checked.image.bytes, checked.image.mime)) return { ok: false, reason: "decode_failed" };
  try {
    const img = await loadImage(Buffer.from(checked.image.bytes));
    if (img.width < MIN_SIDE || img.height < MIN_SIDE || img.width > MAX_SIDE || img.height > MAX_SIDE) {
      return { ok: false, reason: "bad_dimensions" };
    }
    const scale = Math.min(1, OUTPUT_SIDE / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const encoded = new Uint8Array(canvas.toBuffer("image/jpeg", 85));
    if (encoded.length === 0 || encoded.length > MAX_BYTES) return { ok: false, reason: "too_large" };
    if (imageContainsExif(encoded)) return { ok: false, reason: "metadata_remained" };
    return { ok: true, image: { mime: "image/jpeg", bytes: encoded } };
  } catch {
    return { ok: false, reason: "decode_failed" };
  }
}
