import type { SupplierAdapter, SupplierCredentialsInput } from "@/lib/suppliers/types";

/**
 * MOTOwarsztat.pl is a competing workshop SaaS.
 * It consumes wholesaler APIs inbound; it does **not** publish a public API
 * for third-party ERPs to search parts or place orders on behalf of the shop.
 *
 * BESS MOTORS already supports one-way **import** of MW PDFs/screenshots
 * (`motowarsztat-import-parser.ts`, `/api/crm/import-work-order`).
 *
 * Live SupplierAdapter methods are intentionally unsupported.
 */

export const motowarsztatAdapter: SupplierAdapter = {
  id: "motowarsztat",
  displayName: "MOTOwarsztat",
  capabilities: ["importDocuments"],

  async connect(_creds: SupplierCredentialsInput) {
    return {
      status: "not_supported",
      error:
        "MOTOwarsztat nie udostępnia publicznego API dla zewnętrznego ERP. Korzystaj z importu zleceń PDF/OCR w CRM.",
    };
  },

  async authenticate(creds) {
    return this.connect(creds);
  },

  async checkSession() {
    return {
      status: "not_supported",
      error: "Brak sesji API MOTOwarsztat — integracja tylko przez import dokumentów.",
    };
  },
};
