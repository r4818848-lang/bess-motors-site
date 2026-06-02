const MAX_BYTES = 8 * 1024 * 1024;

export async function extractTextFromImportFile(
  buffer: Buffer,
  mime: string
): Promise<string> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("file_too_large");
  }

  if (mime === "application/pdf") {
    const { extractPdfTextFromBuffer } = await import("@/lib/server/pdf-text-extract");
    return extractPdfTextFromBuffer(buffer);
  }

  if (mime.startsWith("image/")) {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("pol+eng", undefined, {
      logger: () => {},
    });
    try {
      const result = await worker.recognize(buffer);
      return result.data.text ?? "";
    } finally {
      await worker.terminate();
    }
  }

  throw new Error("unsupported_type");
}
