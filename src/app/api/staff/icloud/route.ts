import { NextResponse } from "next/server";
import { cronAuthorized, staffCalendarMutationsEnabled } from "@/lib/server/cron-auth";
import { syncICloud } from "@/lib/server/icloud-calendar";
import { verifyTelegramWebAppInitData } from "@/lib/server/telegram-webapp-auth";
import { resolveStaffCalendarActor } from "@/lib/server/staff-calendar-access";
export const maxDuration=60;

async function run() {
  if (!staffCalendarMutationsEnabled()) return NextResponse.json({error:"writes_disabled"},{status:403});
  if (!process.env.BESS_ICLOUD_APP_PASSWORD) return NextResponse.json({error:"icloud_authorization_required"},{status:503});
  try { return NextResponse.json(await syncICloud()); }
  catch { return NextResponse.json({error:"icloud_sync_unavailable"},{status:503}); }
}
export async function GET(req:Request) {
  if (!cronAuthorized(req.headers.get("authorization"))) return NextResponse.json({error:"unauthorized"},{status:401});
  if (!process.env.BESS_ICLOUD_APP_PASSWORD) return NextResponse.json({configured:false});
  return run();
}
export async function POST(req:Request) {
  const auth=verifyTelegramWebAppInitData(req.headers.get("x-telegram-init-data"));
  if (!auth.ok || (await resolveStaffCalendarActor(auth.user.id))?.role!=="owner") return NextResponse.json({error:"forbidden"},{status:403});
  return run();
}
