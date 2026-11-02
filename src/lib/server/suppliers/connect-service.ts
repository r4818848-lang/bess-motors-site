import { getAdapter } from "@/lib/suppliers/registry";
import type {
  SupplierConnectionPublic,
  SupplierCredentialsInput,
  SupplierId,
} from "@/lib/suppliers/types";
import {
  decryptCredentials,
  decryptSessionMeta,
  deleteStoredConnection,
  getStoredConnection,
  listPublicConnections,
  saveCredentialsAndStatus,
  toPublicConnection,
  upsertStoredConnection,
} from "@/lib/server/suppliers/connection-store";
import { encryptSecret } from "@/lib/server/secrets-crypto";
import { isSecretsCryptoConfigured } from "@/lib/server/secrets-crypto";

export async function listSupplierConnections(): Promise<SupplierConnectionPublic[]> {
  return listPublicConnections();
}

export async function connectSupplier(
  supplierId: SupplierId,
  creds: SupplierCredentialsInput,
  environment?: "sandbox" | "production"
): Promise<SupplierConnectionPublic> {
  if (!isSecretsCryptoConfigured()) {
    throw new Error("secrets_key_missing");
  }
  const adapter = getAdapter(supplierId);
  if (!adapter) throw new Error("unknown_supplier");

  // Mark checking without exposing password
  const prev = await getStoredConnection(supplierId);
  if (prev) {
    await upsertStoredConnection({
      ...prev,
      status: "checking",
      lastCheckedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const result = await adapter.connect({
    ...creds,
    extra: {
      ...creds.extra,
      ...(environment ? { environment } : {}),
    },
  });

  const row = await saveCredentialsAndStatus({
    supplierId,
    creds,
    status: result.status,
    sessionMeta: result.sessionMeta,
    lastError: result.error,
    environment:
      environment ||
      (creds.extra?.environment === "sandbox" ? "sandbox" : "production"),
  });
  return toPublicConnection(row);
}

export async function testSupplierConnection(
  supplierId: SupplierId
): Promise<SupplierConnectionPublic> {
  const adapter = getAdapter(supplierId);
  if (!adapter) throw new Error("unknown_supplier");
  const row = await getStoredConnection(supplierId);
  if (!row?.passwordEncrypted) {
    return {
      supplierId,
      displayName: adapter.displayName,
      status: supplierId === "motowarsztat" ? "not_supported" : "not_configured",
      capabilities: adapter.capabilities,
      hasPassword: false,
      lastError:
        supplierId === "motowarsztat"
          ? "Import-only — brak live API"
          : "Brak zapisanych danych logowania",
    };
  }

  await upsertStoredConnection({
    ...row,
    status: "checking",
    lastCheckedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const session = decryptSessionMeta(row);
  let check = await adapter.checkSession(session);
  let authResult: {
    status: typeof check.status;
    error?: string;
    sessionMeta?: Record<string, string>;
  } = check;

  // If session stale, re-authenticate with stored credentials
  if (check.status === "reauth_required" || check.status === "error") {
    const creds = decryptCredentials(row);
    if (creds) {
      authResult = await adapter.authenticate(creds);
      if (authResult.status === "connected" && authResult.sessionMeta) {
        const updated = {
          ...row,
          status: authResult.status,
          sessionMetaEncrypted: encryptSecret(JSON.stringify(authResult.sessionMeta)),
          lastSuccessAt: new Date().toISOString(),
          lastCheckedAt: new Date().toISOString(),
          lastError: undefined,
          updatedAt: new Date().toISOString(),
        };
        await upsertStoredConnection(updated);
        return toPublicConnection(updated);
      }
    }
  }

  const updated = {
    ...row,
    status: authResult.status,
    lastCheckedAt: new Date().toISOString(),
    lastSuccessAt:
      authResult.status === "connected" ? new Date().toISOString() : row.lastSuccessAt,
    lastError: authResult.error,
    updatedAt: new Date().toISOString(),
  };
  await upsertStoredConnection(updated);
  return toPublicConnection(updated);
}

export async function disconnectSupplier(
  supplierId: SupplierId
): Promise<{ ok: boolean }> {
  await deleteStoredConnection(supplierId);
  return { ok: true };
}
