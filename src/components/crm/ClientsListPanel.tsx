"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { deleteClientFromDb, loadDb, saveDb } from "@/lib/store";
import { pushCrmDelete } from "@/lib/cloud-crm-db";
import { useDbSync } from "@/hooks/useDbSync";
import { filterClients } from "@/lib/crm-search";
import { displayOrderTotal } from "@/lib/crm-display-price";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import { CrmSearchInput } from "./CrmSearchInput";
import { CrmListToolbar } from "./CrmListToolbar";
import { AddClientModal } from "./AddClientModal";
export function ClientsListPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const { priceMode } = useCrmDisplay();
  const [query, setQuery] = useState("");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    const vatRate = db.settings.vatRate ?? 23;
    return filterClients(db, query).map((row) => {
      const clientOrders = db.workOrders.filter((o) => o.userId === row.user.id);
      const lastOrder = clientOrders
        .map((o) => o.updatedAt || o.createdAt)
        .sort()
        .reverse()[0];
      const lifetimeTotal = clientOrders.reduce(
        (s, o) => s + displayOrderTotal(o, priceMode, vatRate),
        0
      );
      return { ...row, lastOrder, lifetimeTotal };
    });
  }, [query, dbTick, priceMode]);

  const removeClient = async (userId: string, name: string, orderCount: number) => {
    const msg =
      orderCount > 0
        ? `${c.confirmDeleteClientWithOrders}\n\n${name} · ${orderCount}`
        : `${c.confirmDeleteClient}\n\n${name}`;
    if (!confirm(msg)) return;
    const fresh = loadDb();
    const next = deleteClientFromDb(fresh, userId);
    saveDb(next);
    const ok = await pushCrmDelete(next);
    if (!ok) alert(c.syncFailed);
  };

  return (
    <div className="space-y-5">
      <div className="crm-mw-toolbar">
        <button
          type="button"
          className="crm-mw-btn-create"
          onClick={() => setClientModalOpen(true)}
        >
          <Plus size={18} /> {c.addNewClient}
        </button>
        <button
          type="button"
          className="crm-mw-btn-delete border-amber-200 bg-amber-50 text-amber-900"
          onClick={() => setCompanyModalOpen(true)}
        >
          <Plus size={16} /> {c.addNewCompany}
        </button>
        <Link href="/crm/work-orders?create=1" className="crm-mw-toolbar-icon inline-flex items-center gap-1 text-sm">
          <FileText size={16} /> {c.createOrder}
        </Link>
      </div>

      <AddClientModal open={clientModalOpen} onClose={() => setClientModalOpen(false)} onCreated={() => setClientModalOpen(false)} />
      <AddClientModal
        open={companyModalOpen}
        initialClientType="company"
        onClose={() => setCompanyModalOpen(false)}
        onCreated={() => setCompanyModalOpen(false)}
      />

      <CrmListToolbar>
        <CrmSearchInput value={query} onChange={setQuery} placeholder={c.searchClients} className="max-w-full" />
      </CrmListToolbar>

      <div className="crm-mw-card">
        <div className="table-scroll">
          <table className="crm-mw-table min-w-[800px]">
            <thead>
              <tr>
                <th>{c.registeredDate}</th>
                <th>{c.name}</th>
                <th>{c.email}</th>
                <th>{c.phone}</th>
                <th>{c.vehicles}</th>
                <th>{c.lastOrderDate}</th>
                <th>{c.workOrders}</th>
                <th>{c.clientLifetimeTotal}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-bm-muted py-8">
                    {c.noSearchResults}
                  </td>
                </tr>
              ) : (
                rows.map(({ user, vehicles, orderCount, lastOrder, lifetimeTotal }) => (
                  <tr key={user.id} className="align-top">
                    <td className="text-xs whitespace-nowrap text-bm-muted">
                      {user.createdAt?.slice(0, 10) ?? "—"}
                    </td>
                  <td className="font-semibold">
                    {user.clientType === "company" ? user.companyName || user.name : user.name || "—"}
                    {user.clientType === "company" && user.nip && (
                      <span className="block text-[10px] font-mono text-bm-muted mt-0.5">
                        NIP {user.nip}
                      </span>
                    )}
                    {user.clientTags?.includes("VIP") && (
                        <span className="ml-2 text-[10px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          VIP
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-bm-muted">{user.email || "—"}</td>
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
                    <td className="text-xs whitespace-nowrap">{lastOrder?.slice(0, 10) ?? "—"}</td>
                    <td className="font-mono text-sm text-center">{orderCount}</td>
                    <td className="font-mono text-sm font-semibold whitespace-nowrap">
                      {lifetimeTotal.toFixed(2)} zł
                    </td>
                    <td className="space-y-1 whitespace-nowrap">
                      <Link
                        href={`/crm/work-orders?create=1&client=${user.id}`}
                        className="block text-xs text-bm-red hover:underline font-semibold"
                      >
                        {c.createOrderForClient}
                      </Link>
                      <Link
                        href="/crm?tab=clientHistory"
                        className="block text-xs text-bm-muted hover:text-bm-red"
                      >
                        {c.clientHistoryList}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeClient(user.id, user.name || user.phone, orderCount)}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-500 mt-1"
                      >
                        <Trash2 size={14} /> {c.deleteClient}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
