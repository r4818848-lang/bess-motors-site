const MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_MAX_SIDE = 2200;
const JPEG_QUALITY = 0.86;

export type PrepareImportFileResult =
  | { ok: true; file: File; compressed: boolean }
  | { ok: false; code: "file_too_large" | "read_failed" };

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("read_failed"));
    };
    img.src = url;
  });
}

async function compressImageFile(file: File): Promise<File> {
  const img = await loadImageFromFile(file);
  const maxSide = Math.max(img.width, img.height);
  const scale = maxSide > IMAGE_MAX_SIDE ? IMAGE_MAX_SIDE / maxSide : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/i, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

/** Shrink photos before upload — faster transfer and OCR on server. */
export async function prepareImportUploadFile(file: File): Promise<PrepareImportFileResult> {
  if (file.size > MAX_BYTES && isPdfFile(file)) {
    return { ok: false, code: "file_too_large" };
  }

  if (isPdfFile(file)) {
    return { ok: true, file, compressed: false };
  }

  if (!isImageFile(file)) {
    if (file.size > MAX_BYTES) return { ok: false, code: "file_too_large" };
    return { ok: true, file, compressed: false };
  }

  try {
    const out = await compressImageFile(file);
    if (out.size > MAX_BYTES) {
      return { ok: false, code: "file_too_large" };
    }
    return { ok: true, file: out, compressed: out !== file };
  } catch {
    if (file.size > MAX_BYTES) return { ok: false, code: "file_too_large" };
    return { ok: true, file, compressed: false };
  }
}

export function importFileTooLargeLabel(locale: "ru" | "pl"): string {
  return locale === "ru"
    ? "Файл слишком большой (макс. 8 МБ). Для фото — сожмите или отправьте PDF."
    : "Plik za duży (maks. 8 MB). Dla zdjęcia — zmniejsz lub wyślij PDF.";
}
