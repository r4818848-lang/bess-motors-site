import { NextResponse } from "next/server";
import { getEnvHealth } from "@/lib/server/env-health";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = getEnvHealth();
  return NextResponse.json({
    ok: health.ok,
    ts: new Date().toISOString(),
    cloud: isSupabaseConfigured(),
    vapid: health.checks.find((c) => c.id === "vapid")?.ok ?? false,
    checks: health.checks,
  });
}
