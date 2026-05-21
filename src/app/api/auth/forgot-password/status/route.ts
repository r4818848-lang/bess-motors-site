import { NextResponse } from "next/server";
import { getSmsProvider, isSmsConfigured } from "@/lib/server/sms";

export async function GET() {
  const provider = getSmsProvider();
  return NextResponse.json({
    enabled: isSmsConfigured(),
    provider: provider === "none" ? null : provider,
  });
}
