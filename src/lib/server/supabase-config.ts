export function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function validateServiceRoleKey(key: string): string | null {
  const isLegacyJwt = key.startsWith("eyJ");
  const isNewSecret = key.startsWith("sb_secret_");
  if (!isLegacyJwt && !isNewSecret) {
    return "use_supabase_secret_key_not_publishable";
  }
  if (key.startsWith("sb_publishable_")) {
    return "use_secret_key_not_publishable";
  }
  if (!/^[A-Za-z0-9._-]+$/.test(key)) {
    return "invalid_key_characters";
  }
  if (isLegacyJwt && key.length < 80) return "key_too_short";
  if (isNewSecret && key.length < 24) return "key_too_short";
  return null;
}

export type SupabaseEnvDiagnostic = {
  present: { url: boolean; key: boolean };
  url: { value: string; valid: boolean };
  key: {
    prefix: "sb_secret_" | "eyJ" | "sb_publishable_" | "unknown";
    length: number;
    valid: boolean;
    reason: string | null;
  };
};

export function getSupabaseEnvDiagnostic(): SupabaseEnvDiagnostic {
  const urlRaw = process.env.SUPABASE_URL;
  const keyRaw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = cleanEnvValue(urlRaw);
  const key = cleanEnvValue(keyRaw);

  const urlValid = Boolean(url && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url));

  let prefix: SupabaseEnvDiagnostic["key"]["prefix"] = "unknown";
  if (key.startsWith("sb_secret_")) prefix = "sb_secret_";
  else if (key.startsWith("sb_publishable_")) prefix = "sb_publishable_";
  else if (key.startsWith("eyJ")) prefix = "eyJ";

  const reason = key ? validateServiceRoleKey(key) : "missing";
  const keyValid = Boolean(key && !reason);

  return {
    present: { url: Boolean(url), key: Boolean(key) },
    url: { value: url ? url.replace(/\/$/, "") : "", valid: urlValid },
    key: {
      prefix,
      length: key.length,
      valid: keyValid,
      reason: reason === "missing" ? "missing" : reason,
    },
  };
}

export function getSupabaseConfig(): { url: string; key: string } | null {
  const url = cleanEnvValue(process.env.SUPABASE_URL);
  const key = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) return null;
  if (validateServiceRoleKey(key)) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
