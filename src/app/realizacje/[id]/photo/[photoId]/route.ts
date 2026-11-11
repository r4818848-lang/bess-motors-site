import { publicPhoto } from "@/lib/seo-growth/case-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; photoId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id, photoId } = await params;
  const photo = publicPhoto(id, photoId);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "content-type": photo.mime,
      "x-content-type-options": "nosniff",
      "cache-control": "public, max-age=3600",
    },
  });
}
