/**
 * Additional open-registry sources for Polish NIP lookup (server-side only).
 */

import type { NipCompanyData } from "@/lib/nip-decode";

function normalizeCompanyName(name: string): string {
  return name.replace(/^["']+|["']+$/g, "").replace(/\s+/g, " ").trim();
}

function parsePolishAddress(raw: string): {
  street?: string;
  city?: string;
  postalCode?: string;
} {
  const line = raw.trim();
  if (!line) return {};
  const zipCity = line.match(/(\d{2}-\d{3})\s+(.+)$/i);
  if (zipCity) {
    const before = line.slice(0, zipCity.index).trim().replace(/,?\s*$/, "");
    return {
      postalCode: zipCity[1],
      city: zipCity[2].trim(),
      street: before || undefined,
    };
  }
  return { street: line };
}

export type ExtendedNipSource = "vat" | "regon" | "vies" | "ceidg" | "krs";

function padKrsNumber(krs: string): string {
  const digits = krs.replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(10, "0");
}

/** EU VIES — public REST API (no key). */
export async function lookupFromVies(nip: string): Promise<NipCompanyData | null> {
  try {
    const res = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ countryCode: "PL", vatNumber: nip }),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      valid?: boolean;
      name?: string;
      address?: string;
    };
    if (!data.valid || !data.name || data.name === "---") return null;

    const name = normalizeCompanyName(
      data.name.replace(/^"+|"+$/g, "").replace(/\?/g, "Ż").replace(/AA\?/g, "AŃ")
    );
    const addrLines = (data.address ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const rawAddress = addrLines.join(", ");
    const parsed = parsePolishAddress(rawAddress);

    return {
      found: true,
      nip,
      name,
      rawAddress: rawAddress || undefined,
      street: parsed.street ?? addrLines[0],
      city: parsed.city ?? addrLines[addrLines.length - 1],
      postalCode: parsed.postalCode,
      country: "PL",
      source: "vies",
    };
  } catch {
    return null;
  }
}

/** CEIDG / Biznes.gov.pl — requires JWT from dane.biznes.gov.pl (optional env). */
export async function lookupFromCeidg(nip: string): Promise<NipCompanyData | null> {
  const token =
    process.env.CEIDG_API_TOKEN?.trim() ||
    process.env.BIZNES_GOV_API_KEY?.trim();
  if (!token) return null;

  const base = process.env.CEIDG_API_BASE?.trim() || "https://dane.biznes.gov.pl";
  const urls = [
    `${base}/api/ceidg/v3/firmy?nip=${nip}`,
    `${base}/api/ceidg/v2/firmy?nip=${nip}`,
    `${base}/api/ceidg/v1/firma?nip=${nip}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = parseCeidgPayload(data, nip);
      if (parsed) return parsed;
    } catch {
      continue;
    }
  }
  return null;
}

function parseCeidgPayload(data: unknown, nip: string): NipCompanyData | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;

  const firmy = Array.isArray(root.firmy)
    ? root.firmy
    : Array.isArray(root.items)
      ? root.items
      : root.firma
        ? [root.firma]
        : root.nazwa
          ? [root]
          : [];

  const row = (firmy[0] ?? null) as Record<string, unknown> | null;
  if (!row) return null;

  const nazwa =
    (row.nazwa as string) ||
    (row.name as string) ||
    ((row.dane as Record<string, unknown>)?.nazwa as string);
  if (!nazwa || typeof nazwa !== "string") return null;

  const adres =
    (row.adresDzialalnosci as Record<string, unknown>) ||
    (row.adres as Record<string, unknown>) ||
    (row.siedziba as Record<string, unknown>) ||
    {};

  const ulica = [adres.ulica, adres.nrDomu, adres.nrLokalu]
    .filter(Boolean)
    .join(" ")
    .trim();
  const city = String(adres.miasto ?? "").trim();
  const postalCode = String(adres.kod ?? adres.kodPocztowy ?? "").trim();
  const rawAddress = [ulica, postalCode, city].filter(Boolean).join(", ");

  return {
    found: true,
    nip,
    name: normalizeCompanyName(nazwa),
    regon: String(row.regon ?? row.regon9 ?? "").trim() || undefined,
    street: ulica || undefined,
    city: city || undefined,
    postalCode: postalCode || undefined,
    country: "PL",
    rawAddress: rawAddress || undefined,
    source: "ceidg",
  };
}

/** Ministry of Justice KRS — public, no key (needs KRS number). */
export async function lookupFromKrsOdpis(
  krsRaw: string,
  nip: string
): Promise<NipCompanyData | null> {
  const krs = padKrsNumber(krsRaw);
  if (!krs) return null;

  try {
    const res = await fetch(
      `https://api-krs.ms.gov.pl/api/krs/OdpisAktualny/${krs}?rejestr=P&format=json`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      odpis?: {
        dane?: {
          dzial1?: {
            danePodmiotu?: { nazwa?: string };
            siedzibaIAdres?: {
              adres?: {
                ulica?: string;
                nrDomu?: string;
                nrLokalu?: string;
                miejscowosc?: string;
                kodPocztowy?: string;
              };
            };
            identyfikatory?: { nip?: string; regon?: string };
          };
        };
      };
    };

    const dzial1 = data.odpis?.dane?.dzial1;
    const nazwa = dzial1?.danePodmiotu?.nazwa;
    if (!nazwa) return null;

    const addr = dzial1?.siedzibaIAdres?.adres;
    const street = addr
      ? [addr.ulica, addr.nrDomu, addr.nrLokalu].filter(Boolean).join(" ").trim()
      : undefined;
    const city = addr?.miejscowosc?.trim();
    const postalCode = addr?.kodPocztowy?.trim();
    const rawAddress = [street, postalCode, city].filter(Boolean).join(", ");

    return {
      found: true,
      nip: dzial1?.identyfikatory?.nip?.replace(/\D/g, "") || nip,
      name: normalizeCompanyName(nazwa.replace(/\?/g, "Ż")),
      regon: dzial1?.identyfikatory?.regon,
      street,
      city,
      postalCode,
      rawAddress: rawAddress || undefined,
      country: "PL",
      source: "krs",
    };
  } catch {
    return null;
  }
}
