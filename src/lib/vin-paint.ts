export interface VinPaintInfo {
  color: string;
  colorHex: string;
}

/** Known BMW factory paint codes (also searched inside full VIN) */
const BMW_PAINT: Record<string, VinPaintInfo> = {
  "300": { color: "Alpine White", colorHex: "#f0f0f0" },
  "416": { color: "Carbon Black Metallic", colorHex: "#1a1a1a" },
  "475": { color: "Black Sapphire Metallic", colorHex: "#1c2430" },
  "668": { color: "Jet Black", colorHex: "#0a0a0a" },
  A96: { color: "Mineral Grey Metallic", colorHex: "#5c6268" },
  B39: { color: "Mineral White Metallic", colorHex: "#e8e8e8" },
  C1M: { color: "Portimao Blue Metallic", colorHex: "#1a4a7a" },
  C3Z: { color: "Black Sapphire Metallic", colorHex: "#1c2430" },
  C4P: { color: "Brooklyn Grey Metallic", colorHex: "#6b7280" },
  C4W: { color: "Skyscraper Grey Metallic", colorHex: "#7a8088" },
  C5A: { color: "Tanzanite Blue II Metallic", colorHex: "#2a3a5c" },
  C6A: { color: "San Remo Green Metallic", colorHex: "#3d5249" },
  C6Z: { color: "Isle of Man Green Metallic", colorHex: "#2d4a38" },
  P0: { color: "Alpine White", colorHex: "#f0f0f0" },
};

const MERCEDES_PAINT: Record<string, VinPaintInfo> = {
  "149": { color: "Obsidian Black Metallic", colorHex: "#1a1a1a" },
  "197": { color: "Brilliant Blue Metallic", colorHex: "#1e3a6e" },
  "775": { color: "Iridium Silver Metallic", colorHex: "#b8bcc4" },
  "992": { color: "Selenite Grey Metallic", colorHex: "#8a9099" },
};

const BRAND_FALLBACK_PALETTES: Record<string, VinPaintInfo[]> = {
  BMW: [
    { color: "Carbon Black Metallic", colorHex: "#1a1a1a" },
    { color: "Mineral Grey Metallic", colorHex: "#5c6268" },
    { color: "Alpine White", colorHex: "#f0f0f0" },
    { color: "Portimao Blue Metallic", colorHex: "#1a4a7a" },
    { color: "Brooklyn Grey Metallic", colorHex: "#6b7280" },
    { color: "San Remo Green Metallic", colorHex: "#3d5249" },
  ],
  "Mercedes-Benz": [
    { color: "Obsidian Black Metallic", colorHex: "#1a1a1a" },
    { color: "Selenite Grey Metallic", colorHex: "#8a9099" },
    { color: "Polar White", colorHex: "#f5f5f5" },
    { color: "Brilliant Blue Metallic", colorHex: "#1e3a6e" },
  ],
  Audi: [
    { color: "Mythos Black Metallic", colorHex: "#1a1a1a" },
    { color: "Daytona Grey Pearl", colorHex: "#4b5563" },
    { color: "Glacier White Metallic", colorHex: "#eef0f2" },
    { color: "Navarra Blue Metallic", colorHex: "#1e3a6e" },
  ],
  Porsche: [
    { color: "Jet Black Metallic", colorHex: "#0f0f0f" },
    { color: "Carrara White Metallic", colorHex: "#ececec" },
    { color: "GT Silver Metallic", colorHex: "#b0b5bc" },
    { color: "Guards Red", colorHex: "#c41e1e" },
  ],
  Volkswagen: [
    { color: "Deep Black Pearl", colorHex: "#1a1a1a" },
    { color: "Pure White", colorHex: "#f4f4f4" },
    { color: "Reflex Silver Metallic", colorHex: "#aeb4bc" },
    { color: "Atlantic Blue Metallic", colorHex: "#2a4a7a" },
  ],
};

function lookupPaintTable(vin: string, table: Record<string, VinPaintInfo>): VinPaintInfo | null {
  const upper = vin.toUpperCase();
  for (const [code, info] of Object.entries(table)) {
    if (upper.includes(code.toUpperCase())) return info;
  }
  const slice = upper.slice(10, 14);
  for (let len = 3; len >= 2; len--) {
    for (let i = 0; i <= slice.length - len; i++) {
      const key = slice.slice(i, i + len);
      if (table[key]) return table[key];
    }
  }
  return null;
}

function fallbackFromVin(vin: string, make: string): VinPaintInfo {
  const brandKey =
    Object.keys(BRAND_FALLBACK_PALETTES).find((b) =>
      make.toLowerCase().includes(b.toLowerCase())
    ) ?? "BMW";
  const palette = BRAND_FALLBACK_PALETTES[brandKey] ?? BRAND_FALLBACK_PALETTES.BMW;
  const idx =
    (vin.charCodeAt(11) + vin.charCodeAt(12) + vin.charCodeAt(13) + vin.charCodeAt(14)) %
    palette.length;
  return palette[idx]!;
}

/** Estimate exterior color from VIN + make (paint code in VIN or stable brand palette) */
export function decodeVinPaint(vin: string, make: string): VinPaintInfo {
  const cleaned = vin.replace(/\s/g, "").toUpperCase();
  if (cleaned.length !== 17) {
    return { color: "Metallic Grey", colorHex: "#5c6268" };
  }

  const makeNorm = make.trim();
  if (/bmw/i.test(makeNorm)) {
    const hit = lookupPaintTable(cleaned, BMW_PAINT);
    if (hit) return hit;
  }
  if (/mercedes/i.test(makeNorm)) {
    const hit = lookupPaintTable(cleaned, MERCEDES_PAINT);
    if (hit) return hit;
  }

  return fallbackFromVin(cleaned, makeNorm || "Auto");
}
