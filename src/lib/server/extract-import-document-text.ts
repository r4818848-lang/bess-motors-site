const MAX_BYTES = 8 * 1024 * 1024;

function sniffMime(buffer: Buffer, mime: string): string {
  if (mime && mime !== "application/octet-stream") return mime;
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString() === "%PDF") {
    return "application/pdf";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  return mime || "application/octet-stream";
}

export async function extractTextFromImportFile(
  buffer: Buffer,
  mime: string
): Promise<string> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("file_too_large");
  }

  const resolved = sniffMime(buffer, mime);

  if (resolved === "application/pdf") {
    const { extractPdfTextFromBuffer } = await import("@/lib/server/pdf-text-extract");
    return extractPdfTextFromBuffer(buffer);
  }

  if (resolved.startsWith("image/")) {
    const { ocrImportImageBuffer } = await import("@/lib/server/ocr-import-image");
    return ocrImportImageBuffer(buffer);
  }

  throw new Error("unsupported_type");
}
