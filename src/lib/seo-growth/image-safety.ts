const MAX_BYTES = 4 * 1024 * 1024;

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
