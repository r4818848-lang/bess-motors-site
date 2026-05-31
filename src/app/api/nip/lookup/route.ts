import { NextResponse } from "next/server";
import { lookupNipCompany } from "@/lib/nip-decode";

export async function GET(request: Request) {
  const nip = new URL(request.url).searchParams.get("nip") ?? "";
  const result = await lookupNipCompany(nip);
  if (!result.found) {
    return NextResponse.json(result, { status: result.error === "invalid_nip" ? 400 : 404 });
  }
  return NextResponse.json(result);
}
