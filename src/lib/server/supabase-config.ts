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
