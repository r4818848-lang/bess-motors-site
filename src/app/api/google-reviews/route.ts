import { NextResponse } from "next/server";
import { fetchGooglePlaceReviews } from "@/lib/server/google-places-reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang")?.slice(0, 2) || "pl";
  const data = await fetchGooglePlaceReviews(lang);
  const ok = data.source === "google" && data.status === "ok";
  return NextResponse.json(data, {
    headers: {
      // Never CDN-cache denials / empty — billing/key fixes must show up immediately.
      "Cache-Control": ok
        ? "public, s-maxage=3600, stale-while-revalidate=86400"
        : "private, no-store",
    },
  });
}
