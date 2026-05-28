import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    cloud: isSupabaseConfigured(),
    vapid: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  });
}
