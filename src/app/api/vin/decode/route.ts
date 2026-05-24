import { NextResponse } from "next/server";
import { parseNhtsaVinRow, decodeVinLocal } from "@/lib/vin-decode";
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
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { next: { revalidate: 86400 } }
    );

    if (res.ok) {
      const data = await res.json();
      const row = data.Results?.[0];
      if (row) {
        const parsed = parseNhtsaVinRow(row);
        if (parsed.found) {
          const paint = decodeVinPaint(vin, parsed.make);
          return NextResponse.json({ ...parsed, color: paint.color, colorHex: paint.colorHex });
        }
      }
    }
  } catch {
    /* fall through to local WMI map */
  }

  const local = decodeVinLocal(vin);
  if (local.found) {
    const paint = decodeVinPaint(vin, local.make);
    return NextResponse.json({ ...local, color: paint.color, colorHex: paint.colorHex });
  }

  return NextResponse.json({ found: false, error: "not_found" });
}
