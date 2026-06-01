export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("48") && digits.length >= 11) return `+${digits}`;
  if (digits.length === 9) return `+48${digits}`;
  return phone.replace(/\s/g, "").replace(/-/g, "");
}

/** Lenient match for admin login (spaces, +48, etc.) */
export function phoneDigitsMatch(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "");
  const db = b.replace(/\D/g, "");
  if (!da || !db) return false;
  if (da === db) return true;
  if (da.length >= 9 && db.length >= 9 && da.slice(-9) === db.slice(-9)) return true;
  return normalizePhone(a) === normalizePhone(b);
}

export function normalizePlateKey(plate: string): string {
  return plate.replace(/\s/g, "").replace(/-/g, "").toUpperCase();
}
