/** Polish NIP lookup via Ministry of Finance VAT whitelist API */

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
  error?: string;
};

function parsePolishAddress(raw: string): {
  street?: string;
  city?: string;
  postalCode?: string;
} {
  const line = raw.trim();
  if (!line) return {};
  const zipCity = line.match(/(\d{2}-\d{3})\s+(.+)$/);
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

export async function lookupNipCompany(nipRaw: string): Promise<NipCompanyData> {
  const nip = nipRaw.replace(/\D/g, "");
  if (nip.length !== 10) {
    return { found: false, nip, error: "invalid_nip" };
  }

  const date = new Date().toISOString().slice(0, 10);
  const url = `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return { found: false, nip, error: "api_error" };
    }
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
    if (!subject?.name) {
      return { found: false, nip, error: "not_found" };
    }

    const addrRaw = subject.workingAddress || subject.residenceAddress || "";
    const parsed = parsePolishAddress(addrRaw);

    return {
      found: true,
      nip: subject.nip ?? nip,
      name: subject.name,
      regon: subject.regon,
      statusVat: subject.statusVat,
      rawAddress: addrRaw,
      street: parsed.street,
      city: parsed.city,
      postalCode: parsed.postalCode,
      country: "PL",
    };
  } catch {
    return { found: false, nip, error: "network_error" };
  }
}
