const MAX_BYTES = 8 * 1024 * 1024;

export async function extractTextFromImportFile(
  buffer: Buffer,
  mime: string
): Promise<string> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("file_too_large");
  }

  if (mime === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const data = await parser.getText();
      return data.text ?? "";
    } finally {
      await parser.destroy();
    }
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
