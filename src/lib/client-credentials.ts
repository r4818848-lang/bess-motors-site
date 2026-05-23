const CLIENT_CREDS_KEY = "bess-client-saved-creds";

export interface SavedClientCredentials {
  phone: string;
  plate: string;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("48") && digits.length >= 11) return `+${digits}`;
  if (digits.length === 9) return `+48${digits}`;
  return phone.replace(/\s/g, "").replace(/-/g, "");
}

/** Remember client phone + plate in this browser (for autofill on next login) */
export function saveClientCredentials(phone: string, plate: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizePhone(phone);
  const trimmedPlate = plate.trim();
  if (!normalized || trimmedPlate.length < 2) return;

  const payload: SavedClientCredentials = {
    phone: normalized,
    plate: trimmedPlate,
  };
  localStorage.setItem(CLIENT_CREDS_KEY, JSON.stringify(payload));
}

export function loadClientCredentials(): SavedClientCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLIENT_CREDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedClientCredentials;
    if (!parsed.phone || !parsed.plate) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearClientCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLIENT_CREDS_KEY);
}
