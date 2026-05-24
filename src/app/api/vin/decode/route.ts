import { NextResponse } from "next/server";
import { decodeVinFromSources } from "@/lib/vin-decode-sources";
import { decodeVinPaint } from "@/lib/vin-paint";

export async function GET(request: Request) {
  const vin = new URL(request.url).searchParams
    .get("vin")
    ?.replace(/\s/g, "")
    .toUpperCase();

  if (!vin || vin.length !== 17) {
    return NextResponse.json(
      { found: false, error: "invalid_length" },
      { status: 400 }
    );
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return NextResponse.json(
      { found: false, error: "invalid_format" },
      { status: 400 }
    );
  }

  try {
    const decoded = await decodeVinFromSources(vin);
    if (decoded.found && decoded.make) {
      const paint = decodeVinPaint(vin, decoded.make);
      return NextResponse.json({
        ...decoded,
        color: decoded.color || paint.color,
        colorHex: decoded.colorHex || paint.colorHex,
      });
    }
    return NextResponse.json({ found: false, error: decoded.error ?? "not_found" });
  } catch {
    return NextResponse.json({ found: false, error: "server_error" }, { status: 500 });
  }
}
