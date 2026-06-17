/** Parse trailing segment after a fixed callback_data prefix. */
export function callbackSuffix(data: string, prefix: string): string {
  if (!data.startsWith(prefix)) return "";
  return data.slice(prefix.length);
}

export function callbackPage(data: string, prefix: string): number {
  const raw = callbackSuffix(data, prefix);
  return Number.parseInt(raw, 10) || 0;
}
