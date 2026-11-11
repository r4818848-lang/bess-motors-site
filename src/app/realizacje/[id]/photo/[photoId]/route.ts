import { publicPhoto } from "@/lib/seo-growth/case-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; photoId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id, photoId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(photoId)) {
    return new Response("Not found", { status: 404 });
  }
  const photo = await publicPhoto(id, photoId);
  if (!photo.ok) {
    const status = photo.error === "STORAGE_UNAVAILABLE" ? 503 : 404;
    return new Response(photo.error === "STORAGE_UNAVAILABLE" ? "STORAGE_UNAVAILABLE" : "Not found", { status });
  }
  return new Response(new Uint8Array(photo.value.bytes), {
    headers: {
      "content-type": photo.value.mime,
      "x-content-type-options": "nosniff",
      "cache-control": "public, max-age=3600",
    },
  });
}
