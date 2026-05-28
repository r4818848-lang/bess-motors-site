import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/server/web-push-send";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const key = getVapidPublicKey();
  return NextResponse.json({ key });
}
