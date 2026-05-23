/** Saved client login (phone + registration plate) for browser autofill */
const STORAGE_KEY = "bess-client-saved-login";

export interface SavedClientLogin {
  phone: string;
  plate: string;
}

export function saveClientCredentials(phone: string, plate: string): void {
  if (typeof window === "undefined") return;
  const phoneTrim = phone.trim();
  const plateTrim = plate.trim();
  if (!phoneTrim || !plateTrim) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ phone: phoneTrim, plate: plateTrim })
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadClientCredentials(): SavedClientLogin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedClientLogin;
    if (parsed?.phone?.trim() && parsed?.plate?.trim()) {
      return { phone: parsed.phone.trim(), plate: parsed.plate.trim() };
    }
  } catch {
    /* ignore corrupt data */
  }
  return null;
}

export function clearClientCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
