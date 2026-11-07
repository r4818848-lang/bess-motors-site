import type { PriceCompareGroup, SupplierPartOffer } from "@/lib/suppliers/types";

function normArticle(a: string): string {
  return a.replace(/[\s\-./]/g, "").toUpperCase();
}

function normBrand(b: string): string {
  return b.trim().toUpperCase();
}

/** Group offers that look like the same part across suppliers (brand + article). */
export function compareSupplierOffers(offers: SupplierPartOffer[]): PriceCompareGroup[] {
  const map = new Map<string, SupplierPartOffer[]>();
  for (const o of offers) {
    if (o.fromCache && o.cacheAgeMs > 5 * 60_000) continue; // skip stale as "current"
    const key = `${normBrand(o.manufacturer)}::${normArticle(o.article)}`;
    const list = map.get(key) || [];
    list.push(o);
    map.set(key, list);
  }

  const groups: PriceCompareGroup[] = [];
  for (const [key, list] of map) {
    const sorted = [...list].sort((a, b) => a.purchasePrice - b.purchasePrice);
    const cheapest = sorted[0];
    const sameBrand = sorted.filter(
      (o) => normBrand(o.manufacturer) === normBrand(cheapest.manufacturer)
    );
    const bestSameBrand = sameBrand.sort((a, b) => a.purchasePrice - b.purchasePrice)[0];

    const explanationPl = buildExplanationPl(sorted, cheapest, bestSameBrand);
    const explanationRu = buildExplanationRu(sorted, cheapest, bestSameBrand);

    groups.push({
      key,
      manufacturer: cheapest.manufacturer || "—",
      article: cheapest.article,
      name: cheapest.name,
      offers: sorted,
      explanationPl,
      explanationRu,
    });
  }

  return groups.sort((a, b) => {
    const pa = a.offers[0]?.purchasePrice ?? 0;
    const pb = b.offers[0]?.purchasePrice ?? 0;
    return pa - pb;
  });
}

function fmt(o: SupplierPartOffer): string {
  const del = o.deliveryEstimate ? ` — ${o.deliveryEstimate}` : "";
  const cache = o.fromCache ? " (cache)" : "";
  return `${o.manufacturer || "?"} — ${o.supplierName} — ${o.purchasePrice.toFixed(2)} ${o.currency} netto${del}${cache}`;
}

function buildExplanationPl(
  sorted: SupplierPartOffer[],
  cheapest: SupplierPartOffer,
  bestSameBrand: SupplierPartOffer
): string {
  const lines = sorted.map(fmt);
  let text = `Najtańsza oferta: ${fmt(cheapest)}.`;
  if (bestSameBrand && bestSameBrand !== cheapest) {
    text += ` Jeśli wymagany jest dokładnie ${bestSameBrand.manufacturer}, korzystniejszy zakup u ${bestSameBrand.supplierName} (${bestSameBrand.purchasePrice.toFixed(2)} ${bestSameBrand.currency} netto${bestSameBrand.deliveryEstimate ? `, dostawa: ${bestSameBrand.deliveryEstimate}` : ""}).`;
  } else if (sorted.length > 1) {
    const second = sorted[1];
    text += ` Alternatywa: ${fmt(second)}.`;
  }
  text += ` Taniej nie zawsze znaczy właściwie — sprawdź jakość, zastosowanie do VIN i termin.`;
  text += ` Oferty: ${lines.join("; ")}.`;
  return text;
}

function buildExplanationRu(
  sorted: SupplierPartOffer[],
  cheapest: SupplierPartOffer,
  bestSameBrand: SupplierPartOffer
): string {
  let text = `Самый дешёвый вариант: ${fmt(cheapest)}.`;
  if (bestSameBrand && bestSameBrand !== cheapest) {
    text += ` Если нужен именно ${bestSameBrand.manufacturer}, выгоднее закупка у ${bestSameBrand.supplierName} (${bestSameBrand.purchasePrice.toFixed(2)} ${bestSameBrand.currency} netto${bestSameBrand.deliveryEstimate ? `, доставка: ${bestSameBrand.deliveryEstimate}` : ""}).`;
  } else if (sorted.length > 1) {
    text += ` Альтернатива: ${fmt(sorted[1])}.`;
  }
  text += ` Дешевле не всегда значит подходящее — учитывайте качество, применимость к VIN и сроки.`;
  return text;
}
