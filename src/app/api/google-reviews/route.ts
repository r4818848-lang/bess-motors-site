import { NextResponse } from "next/server";
import { fetchGooglePlaceReviews } from "@/lib/server/google-places-reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang")?.slice(0, 2) || "pl";
  const data = await fetchGooglePlaceReviews(lang);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
