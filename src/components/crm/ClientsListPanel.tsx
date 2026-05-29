"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import { filterClients } from "@/lib/crm-search";
import { CrmSearchInput } from "./CrmSearchInput";

export function ClientsListPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const [query, setQuery] = useState("");
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    return filterClients(db, query);
  }, [query, dbTick]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl uppercase text-glow">{c.clientsList}</h2>
      <CrmSearchInput value={query} onChange={setQuery} placeholder={c.search} />
      <div className="glass-red rounded-xl overflow-hidden neon-border">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>{c.name}</th>
              <th>{c.phone}</th>
              <th>{c.vehicles}</th>
              <th>VIN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-bm-muted py-8">
                  {c.noSearchResults}
                </td>
              </tr>
            ) : (
              rows.map(({ user, vehicles }) => (
                <tr key={user.id} className="hover:bg-white/5 align-top">
                  <td className="font-semibold">
                    {user.name || "—"}
                    {user.clientTags?.includes("VIP") && (
                      <span className="ml-2 text-[10px] uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                        VIP
                      </span>
                    )}
                  </td>
                  <td className="font-mono text-sm text-bm-red">{user.phone}</td>
                  <td>
                    {vehicles.length === 0 ? (
                      <span className="text-bm-muted text-xs">—</span>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {vehicles.map((v) => (
                          <li key={v.id}>
                            {v.make} {v.model}
                            {v.plate ? ` · ${v.plate}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="font-mono text-xs text-bm-muted">
                    {vehicles.map((v) => v.vin || "—").join(", ") || "—"}
                  </td>
                  <td>
                    <Link
                      href="/crm/work-orders"
                      className="text-xs text-bm-red hover:underline whitespace-nowrap"
                    >
                      {c.workOrders}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
