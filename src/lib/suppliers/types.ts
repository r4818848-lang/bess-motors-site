/** Shared supplier integration types — no invented endpoints; adapters declare capability. */

export type SupplierId = "inter_cars" | "auto_partner" | "hart" | "motowarsztat";

export type SupplierConnectionStatus =
  | "not_configured"
  | "checking"
  | "connected"
  | "reauth_required"
  | "user_action_required"
  | "error"
  | "temporarily_unavailable"
  | "not_supported";

export type PriceBasis = "net" | "gross";

export interface SupplierCredentialsInput {
  login: string;
  password: string;
  /** Optional extra fields (kh_kod, clientId, branchId, baseUrl, …) */
  extra?: Record<string, string>;
}

export interface SupplierConnectionPublic {
  supplierId: SupplierId;
  displayName: string;
  status: SupplierConnectionStatus;
  loginHint?: string;
  lastSuccessAt?: string;
  lastCheckedAt?: string;
  lastError?: string;
  capabilities: SupplierCapability[];
  environment?: "sandbox" | "production";
  hasPassword: boolean;
}

export type SupplierCapability =
  | "authenticate"
  | "checkSession"
  | "searchByVIN"
  | "searchByOEM"
  | "searchByArticle"
  | "searchByName"
  | "getProductDetails"
  | "getPrices"
  | "getAvailability"
  | "getDeliveryEstimate"
  | "getAlternatives"
  | "getBasket"
  | "addToBasket"
  | "placeOrder"
  | "importDocuments";

export interface PartsSearchQuery {
  vin?: string;
  oem?: string;
  article?: string;
  name?: string;
  make?: string;
  model?: string;
  brand?: string;
  /** Prefer net purchase prices */
  priceBasis?: PriceBasis;
}

export interface SupplierPartOffer {
  supplierId: SupplierId;
  supplierName: string;
  manufacturer: string;
  article: string;
  name: string;
  /** Purchase price as returned by supplier */
  purchasePrice: number;
  priceBasis: PriceBasis;
  currency: string;
  vatRate?: number;
  /** Suggested sell price (workshop markup applied server-side; null if not computed) */
  sellPrice?: number;
  availability?: string;
  quantityAvailable?: number;
  deliveryEstimate?: string;
  deliveryConfirmed?: boolean;
  alternativesHint?: string;
  applicableToVin?: boolean | null;
  qualityTier?: string;
  fetchedAt: string;
  cacheAgeMs: number;
  fromCache: boolean;
  rawRef?: string;
  sourceLabel: string;
}

export interface SupplierSearchResult {
  supplierId: SupplierId;
  ok: boolean;
  status: SupplierConnectionStatus;
  offers: SupplierPartOffer[];
  error?: string;
  durationMs: number;
}

export interface PriceCompareGroup {
  key: string;
  manufacturer: string;
  article: string;
  name: string;
  offers: SupplierPartOffer[];
  explanationPl: string;
  explanationRu: string;
}

export interface SupplierAdapter {
  readonly id: SupplierId;
  readonly displayName: string;
  readonly capabilities: SupplierCapability[];

  connect(creds: SupplierCredentialsInput): Promise<{
    status: SupplierConnectionStatus;
    error?: string;
    sessionMeta?: Record<string, string>;
  }>;

  authenticate(creds: SupplierCredentialsInput): Promise<{
    status: SupplierConnectionStatus;
    error?: string;
    sessionMeta?: Record<string, string>;
  }>;

  checkSession(sessionMeta: Record<string, string>): Promise<{
    status: SupplierConnectionStatus;
    error?: string;
  }>;

  searchByVIN?(
    query: PartsSearchQuery,
    sessionMeta: Record<string, string>
  ): Promise<SupplierPartOffer[]>;

  searchByOEM?(
    query: PartsSearchQuery,
    sessionMeta: Record<string, string>
  ): Promise<SupplierPartOffer[]>;

  searchByArticle?(
    query: PartsSearchQuery,
    sessionMeta: Record<string, string>
  ): Promise<SupplierPartOffer[]>;

  searchByName?(
    query: PartsSearchQuery,
    sessionMeta: Record<string, string>
  ): Promise<SupplierPartOffer[]>;

  getProductDetails?(
    ref: string,
    sessionMeta: Record<string, string>
  ): Promise<SupplierPartOffer | null>;

  getPrices?(
    refs: string[],
    sessionMeta: Record<string, string>
  ): Promise<SupplierPartOffer[]>;

  getAvailability?(
    refs: string[],
    sessionMeta: Record<string, string>
  ): Promise<SupplierPartOffer[]>;

  getDeliveryEstimate?(
    ref: string,
    sessionMeta: Record<string, string>
  ): Promise<string | null>;

  getAlternatives?(
    ref: string,
    sessionMeta: Record<string, string>
  ): Promise<SupplierPartOffer[]>;

  getBasket?(sessionMeta: Record<string, string>): Promise<unknown>;

  addToBasket?(
    ref: string,
    qty: number,
    sessionMeta: Record<string, string>
  ): Promise<{ ok: boolean; error?: string }>;

  disconnect?(): Promise<void>;
}

export const SUPPLIER_DISPLAY: Record<SupplierId, string> = {
  inter_cars: "Inter Cars",
  auto_partner: "Auto Partner",
  hart: "Hart",
  motowarsztat: "MOTOwarsztat",
};
