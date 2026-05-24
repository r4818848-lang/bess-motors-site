import type { VinDecodeResult } from "./vin-decode";
import { decodeVinLocal, emptyVinResult } from "./vin-decode";
import { buildConsensus } from "./vin-decode-consensus";
import { normalizeVinDecode } from "./vin-decode-normalize";
import { fetchAutoDevHit } from "./vin-providers/autodev";
import { fetchNhtsaExtendedHit, fetchNhtsaValuesHit } from "./vin-providers/nhtsa";
import { fetchTecDocVin } from "./vin-providers/tecdoc";
import type { VinProviderHit } from "./vin-providers/types";
import { fetchVincarioHit } from "./vin-providers/vincario";
import { fetchVindata } from "./vin-providers/vindata";
import { fetchVindecoderPl } from "./vin-providers/vindecoder-pl";

export type { VinSourceId } from "./vin-providers/types";

export interface VinDecodeMeta {
  sourcesUsed: string[];
  confidence: number;
}

/** Run all configured VIN providers in parallel */
async function collectProviderHits(vin: string): Promise<VinProviderHit[]> {
  const results = await Promise.all([
    fetchTecDocVin(vin),
    fetchVindecoderPl(vin),
    fetchVincarioHit(vin),
    fetchVindata(vin),
    fetchAutoDevHit(vin),
    fetchNhtsaValuesHit(vin),
    fetchNhtsaExtendedHit(vin),
  ]);

  return results.filter((h): h is VinProviderHit => h != null);
}

/**
 * Multi-source VIN decode with weighted consensus.
 * Parts-catalog APIs (TecDoc, VINdecoder.pl) are preferred for EU vehicles.
 */
export async function decodeVinFromSources(
  vin: string,
  options?: { includeMeta?: boolean }
): Promise<VinDecodeResult & Partial<VinDecodeMeta>> {
  const hits = await collectProviderHits(vin);

  if (hits.length > 0) {
    const { result, series, bodyClass, sourcesUsed, confidence } = buildConsensus(hits);
    if (result.make) {
      const normalized = normalizeVinDecode(
        vin,
        { ...emptyVinResult, ...result, found: true },
        { series, bodyClass }
      );
      if (options?.includeMeta) {
        return { ...normalized, sourcesUsed, confidence };
      }
      return normalized;
    }
  }

  const local = decodeVinLocal(vin);
  if (local.found) {
    const normalized = normalizeVinDecode(vin, local, {});
    const meta: VinDecodeMeta = {
      sourcesUsed: ["wmi"],
      confidence: local.model ? 35 : 20,
    };
    return options?.includeMeta ? { ...normalized, ...meta } : normalized;
  }

  return { ...emptyVinResult, error: "not_found" };
}

/** Which optional providers are configured (for admin/debug UI) */
export function listConfiguredVinProviders(): string[] {
  const list = ["nhtsa", "nhtsa-extended", "wmi"];
  if (process.env.TECDOC_API_KEY?.trim()) list.push("tecdoc");
  if (process.env.VINDECODER_PL_API_UID?.trim() && process.env.VINDECODER_PL_API_KEY?.trim()) {
    list.push("vindecoder-pl");
  }
  if (process.env.VINCARIO_API_KEY?.trim() && process.env.VINCARIO_API_SECRET?.trim()) {
    list.push("vincario");
  }
  if (process.env.VINDATA_API_KEY?.trim()) list.push("vindata");
  if (process.env.AUTO_DEV_API_KEY?.trim()) list.push("autodev");
  return list;
}
