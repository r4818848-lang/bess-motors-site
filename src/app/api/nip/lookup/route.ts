import { NextResponse } from "next/server";
import { lookupNipCompany } from "@/lib/nip-decode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const nip = new URL(request.url).searchParams.get("nip") ?? "";
  const result = await lookupNipCompany(nip);
  const status = !result.found
    ? result.error === "invalid_nip" || result.error === "invalid_checksum"
      ? 400
      : 404
    : 200;
  return NextResponse.json(result, {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
