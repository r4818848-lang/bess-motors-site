import type { VinDecodeResult } from "../vin-decode";

/** Provider identifiers (shown in debug mode) */
export type VinSourceId =
  | "nhtsa"
  | "nhtsa-extended"
  | "vincario"
  | "vindecoder-pl"
  | "tecdoc"
  | "vindata"
  | "autodev"
  | "wmi";

export interface VinProviderHit {
  source: VinSourceId;
  /** Higher = more trusted in consensus (parts catalogs > US gov DB) */
  weight: number;
  data: Partial<VinDecodeResult>;
  series?: string;
  bodyClass?: string;
}
