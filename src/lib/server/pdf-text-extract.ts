/**
 * Server-only PDF text extraction (Vercel/Node).
 * pdf-parse uses pdfjs-dist which needs CanvasFactory + @napi-rs/canvas.
 */
import "pdf-parse/worker";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer, CanvasFactory });
  try {
    const data = await parser.getText();
    return data.text ?? "";
  } finally {
    await parser.destroy();
  }
}
