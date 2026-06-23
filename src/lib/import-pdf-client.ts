/** Client-side PDF text extraction — instant parse without server round-trip. */

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export { isPdfFile };

export async function extractPdfTextClient(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const version = pdfjs.version || "5.4.296";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const chunks: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    let line = "";
    for (const item of content.items) {
      if (!("str" in item) || typeof item.str !== "string") continue;
      line += item.str;
      if ("hasEOL" in item && item.hasEOL) {
        chunks.push(line);
        line = "";
      } else {
        line += " ";
      }
    }
    if (line.trim()) chunks.push(line);
    chunks.push("\n");
  }

  await doc.destroy();
  return chunks.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
