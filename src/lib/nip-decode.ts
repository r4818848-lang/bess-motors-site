/** Polish NIP lookup: MF VAT whitelist + GUS REGON (BIR) */

import Bir from "bir1";

export type NipLookupSource = "vat" | "regon";

export type NipCompanyData = {
  found: boolean;
  nip: string;
  name?: string;
  regon?: string;
  statusVat?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  rawAddress?: string;
  source?: NipLookupSource;
  error?: "invalid_nip" | "invalid_checksum" | "not_found" | "api_error" | "network_error";
};

/** NIP checksum (weights 6,5,7,2,3,4,5,6,7) */
export function isValidNipChecksum(nipRaw: string): boolean {
  const nip = nipRaw.replace(/\D/g, "");
  if (nip.length !== 10 || !/^\d+$/.test(nip)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(nip[i]) * weights[i];
  let check = sum % 11;
  if (check === 10) check = 0;
  return check === Number(nip[9]);
}

export function normalizeCompanyName(name: string): string {
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

function buildStreet(ulica?: string, nr?: string, lokal?: string): string | undefined {
  const base = [ulica?.trim(), nr?.trim()].filter(Boolean).join(" ").trim();
  if (!base) return undefined;
  const loc = lokal?.trim();
  return loc ? `${base}/${loc}` : base;
}

async function lookupFromVatWhitelist(nip: string): Promise<NipCompanyData | null> {
  const date = new Date().toISOString().slice(0, 10);
  const url = `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    result?: {
      subject?: {
        name?: string;
        nip?: string;
        regon?: string;
        statusVat?: string;
        residenceAddress?: string;
        workingAddress?: string;
      };
    };
  };

  const subject = data.result?.subject;
  if (!subject?.name) return null;

  const addrRaw = subject.workingAddress || subject.residenceAddress || "";
  const parsed = parsePolishAddress(addrRaw);

  return {
    found: true,
    nip: subject.nip ?? nip,
    name: normalizeCompanyName(subject.name),
    regon: subject.regon,
    statusVat: subject.statusVat,
    rawAddress: addrRaw,
    street: parsed.street,
    city: parsed.city,
    postalCode: parsed.postalCode,
    country: "PL",
    source: "vat",
  };
}

type GusSearchRow = {
  Nazwa?: string;
  Nip?: string;
  Regon?: string;
  Ulica?: string;
  NrNieruchomosci?: string;
  NrLokalu?: string;
  KodPocztowy?: string;
  Miejscowosc?: string;
};

async function lookupFromGusRegon(nip: string): Promise<NipCompanyData | null> {
  const apiKey = process.env.GUS_REGON_API_KEY?.trim();
  const bir = new Bir(apiKey ? { key: apiKey } : {});

  let row: GusSearchRow;
  try {
    row = (await bir.search({ nip })) as GusSearchRow;
  } catch {
    return null;
  }

  if (!row?.Nazwa) return null;

  const street = buildStreet(row.Ulica, row.NrNieruchomosci, row.NrLokalu);
  const city = row.Miejscowosc?.trim();
  const postalCode = row.KodPocztowy?.trim();
  const rawAddress = [street, postalCode, city].filter(Boolean).join(", ");

  return {
    found: true,
    nip: row.Nip?.replace(/\D/g, "") || nip,
    name: normalizeCompanyName(row.Nazwa),
    regon: row.Regon,
    rawAddress: rawAddress || undefined,
    street,
    city,
    postalCode,
    country: "PL",
    source: "regon",
  };
}

export async function lookupNipCompany(nipRaw: string): Promise<NipCompanyData> {
  const nip = nipRaw.replace(/\D/g, "");
  if (nip.length !== 10) {
    return { found: false, nip, error: "invalid_nip" };
  }
  if (!isValidNipChecksum(nip)) {
    return { found: false, nip, error: "invalid_checksum" };
  }

  try {
    const fromVat = await lookupFromVatWhitelist(nip);
    if (fromVat) return fromVat;

    const fromGus = await lookupFromGusRegon(nip);
    if (fromGus) return fromGus;

    return { found: false, nip, error: "not_found" };
  } catch {
    return { found: false, nip, error: "network_error" };
  }
}
