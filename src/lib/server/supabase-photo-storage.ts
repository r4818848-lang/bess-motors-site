import { getSupabaseConfig } from "@/lib/server/supabase-config";

/** Upload base64 image to Supabase Storage when bucket configured */
export async function uploadWorkOrderPhoto(
  orderId: string,
  fileId: string,
  dataUrl: string
): Promise<string | null> {
  const cfg = getSupabaseConfig();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "work-order-files";
  if (!cfg || !dataUrl.startsWith("data:image")) return null;

  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;

  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const path = `${orderId}/${fileId}.${ext}`;
  const body = Buffer.from(match[2], "base64");

  const url = `${cfg.url}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": `image/${match[1]}`,
      "x-upsert": "true",
    },
    body,
  });

  if (!res.ok) return null;
  return `${cfg.url}/storage/v1/object/public/${bucket}/${path}`;
}
