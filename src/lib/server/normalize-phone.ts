export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("48") && digits.length >= 11) return `+${digits}`;
  if (digits.length === 9) return `+48${digits}`;
  return phone.replace(/\s/g, "").replace(/-/g, "");
}

export function normalizePlateKey(plate: string): string {
  return plate.replace(/\s/g, "").replace(/-/g, "").toUpperCase();
}
