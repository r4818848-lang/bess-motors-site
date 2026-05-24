import { fetchVincario } from "../vincario-decode";
import type { VinProviderHit } from "./types";

export async function fetchVincarioHit(vin: string): Promise<VinProviderHit | null> {
  const data = await fetchVincario(vin);
  if (!data?.make) return null;
  return { source: "vincario", weight: 88, data };
}
