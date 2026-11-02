"use client";

import { useState } from "react";
import { staffCrmFetch } from "@/lib/crm-staff-fetch";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PriceCompareGroup, SupplierPartOffer, SupplierSearchResult } from "@/lib/suppliers/types";

export function PartsSearchPanel() {
  const [article, setArticle] = useState("");
  const [oem, setOem] = useState("");
  const [vin, setVin] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offers, setOffers] = useState<SupplierPartOffer[]>([]);
  const [results, setResults] = useState<SupplierSearchResult[]>([]);
  const [groups, setGroups] = useState<PriceCompareGroup[]>([]);

  const body = () => ({
    article: article.trim() || undefined,
    oem: oem.trim() || undefined,
    vin: vin.trim() || undefined,
    name: name.trim() || undefined,
    brand: brand.trim() || undefined,
  });

  const search = async () => {
    setLoading(true);
    setError("");
    setGroups([]);
    const res = await staffCrmFetch("/api/crm/suppliers/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body()),
    });
    setLoading(false);
    if (!res?.ok) {
      setError("Поиск не выполнен — проверьте подключения поставщиков");
      return;
    }
    const json = (await res.json()) as {
      offers: SupplierPartOffer[];
      results: SupplierSearchResult[];
    };
    setOffers(json.offers || []);
    setResults(json.results || []);
  };

  const compare = async () => {
    setLoading(true);
    setError("");
    const res = await staffCrmFetch("/api/crm/suppliers/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body()),
    });
    setLoading(false);
    if (!res?.ok) {
      setError("Сравнение не выполнено");
      return;
    }
    const json = (await res.json()) as {
      groups: PriceCompareGroup[];
      results: SupplierSearchResult[];
      offers?: SupplierPartOffer[];
    };
    setGroups(json.groups || []);
    setResults(json.results || []);
    if (json.offers) setOffers(json.offers);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg uppercase">Поиск запчастей у поставщиков</h3>
        <p className="text-sm text-bm-muted">
          Цены закупочные netto. Кеш помечен отдельно — не считайте устаревший кеш актуальным.
        </p>
      </div>
      <Card className="p-4 grid md:grid-cols-3 gap-3">
        <input
          className="input-premium"
          placeholder="Артикул"
          value={article}
          onChange={(e) => setArticle(e.target.value)}
        />
        <input
          className="input-premium"
          placeholder="OEM"
          value={oem}
          onChange={(e) => setOem(e.target.value)}
        />
        <input
          className="input-premium"
          placeholder="VIN"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
        />
        <input
          className="input-premium"
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input-premium"
          placeholder="Бренд"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
        <div className="flex gap-2">
          <Button type="button" disabled={loading} onClick={() => void search()}>
            Искать
          </Button>
          <Button type="button" disabled={loading} onClick={() => void compare()}>
            Сравнить цены
          </Button>
        </div>
      </Card>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {results.length > 0 && (
        <ul className="text-xs text-bm-muted space-y-1">
          {results.map((r) => (
            <li key={r.supplierId}>
              {r.supplierId}: {r.ok ? `${r.offers.length} офер` : r.error} ({r.durationMs} ms)
            </li>
          ))}
        </ul>
      )}
      {groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((g) => (
            <Card key={g.key} className="p-4">
              <p className="font-semibold">
                {g.manufacturer} {g.article} — {g.name}
              </p>
              <p className="text-sm mt-2">{g.explanationRu}</p>
              <p className="text-xs text-bm-muted mt-1">{g.explanationPl}</p>
            </Card>
          ))}
        </div>
      )}
      {offers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-bm-muted">
                <th className="p-2">Поставщик</th>
                <th className="p-2">Производитель</th>
                <th className="p-2">Артикул</th>
                <th className="p-2">Наименование</th>
                <th className="p-2">Закуп netto</th>
                <th className="p-2">VAT</th>
                <th className="p-2">Продажа</th>
                <th className="p-2">Наличие</th>
                <th className="p-2">Доставка</th>
                <th className="p-2">Обновлено</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o, i) => (
                <tr key={`${o.supplierId}-${o.article}-${i}`} className="border-t border-white/5">
                  <td className="p-2">{o.supplierName}</td>
                  <td className="p-2">{o.manufacturer}</td>
                  <td className="p-2 font-mono text-xs">{o.article}</td>
                  <td className="p-2">{o.name}</td>
                  <td className="p-2">
                    {o.purchasePrice.toFixed(2)} {o.currency}
                    {o.fromCache ? " *" : ""}
                  </td>
                  <td className="p-2">{o.vatRate ?? "—"}%</td>
                  <td className="p-2">
                    {o.sellPrice != null ? `${o.sellPrice.toFixed(2)} ${o.currency}` : "—"}
                  </td>
                  <td className="p-2">{o.availability || "—"}</td>
                  <td className="p-2">{o.deliveryEstimate || "—"}</td>
                  <td className="p-2 text-xs">
                    {new Date(o.fetchedAt).toLocaleString("pl-PL")}
                    {o.fromCache ? ` (cache ${Math.round(o.cacheAgeMs / 1000)}s)` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-bm-muted mt-2">
            * fromCache — данные из кратковременного кеша, не выдавайте как свежую цену без проверки.
            Источник: колонка поставщика / sourceLabel в API.
          </p>
        </div>
      )}
    </div>
  );
}
