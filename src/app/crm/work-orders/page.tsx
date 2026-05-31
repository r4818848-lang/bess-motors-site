"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, LogOut } from "lucide-react";
import { SignLinkShareBlock } from "@/components/work-order/SignLinkShareBlock";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { WorkOrderForm } from "@/components/crm/WorkOrderForm";
import { logoutAdmin } from "@/lib/auth";
import { loadDb } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { filterWorkOrders, defaultWorkOrderFilters } from "@/lib/workorder-filters";
import { filterOpenWorkOrders } from "@/lib/work-order-lifecycle";
import { filterWorkOrdersByQuery } from "@/lib/crm-search";
import { WorkOrderFilters } from "@/components/crm/WorkOrderFilters";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { Button } from "@/components/ui/Button";
import { VehicleThumbnail } from "@/components/vehicle/VehicleThumbnail";
import { WorkOrderKanban } from "@/components/crm/WorkOrderKanban";
import { useDbSync } from "@/hooks/useDbSync";
import { CrmWorkOrderPresets } from "@/components/crm/CrmWorkOrderPresets";

function WorkOrdersPageContent() {
  const { t } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const sig = t.signature;
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const dbTick = useDbSync();
  const [filters, setFilters] = useState(defaultWorkOrderFilters);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(() => {}, []);

  useEffect(() => {
    const edit = searchParams.get("edit");
    if (edit) setEditingId(edit);
    if (searchParams.get("create") === "1") setCreating(true);
  }, [searchParams]);

  const db = loadDb();
  void dbTick;
  const pm = t.paymentMethods;
  const ps = t.paymentStatus;

  const filteredOrders = useMemo(() => {
    const openOnly = filterOpenWorkOrders(db.workOrders);
    const byStatus = filterWorkOrders([...openOnly], filters);
    const bySearch = filterWorkOrdersByQuery(db, byStatus, searchQuery);
    return bySearch.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db, filters, searchQuery, dbTick]);

  if (creating || editingId) {
    return (
      <DashboardLayout role="admin">
        <div className="p-6 lg:p-10">
          <WorkOrderForm
            orderId={editingId}
            initialUserId={creating ? searchParams.get("client") : null}
            onClose={() => {
              setCreating(false);
              setEditingId(null);
            }}
            onSaved={() => {
              setCreating(false);
              setEditingId(null);
              refresh();
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 lg:p-10 space-y-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <Link href="/crm" className="text-sm text-bm-muted hover:text-bm-red">
              ← CRM
            </Link>
            <h1 className="font-display text-2xl font-bold uppercase text-glow mt-2">
              {w.ordersTitle}
            </h1>
            <p className="text-sm text-bm-muted mt-1">{w.adminOnly}</p>
            <p className="text-xs text-bm-muted mt-1">{c.openOrdersOnly}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/crm/order-history" className="btn-outline text-xs py-2 inline-flex items-center gap-2 self-center">
              {c.orderHistoryList}
            </Link>
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> {c.createOrder}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                logoutAdmin();
                refresh();
              }}
            >
              <LogOut size={16} /> {c.logout}
            </Button>
          </div>
        </div>

        <CrmSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={c.search}
          className="max-w-xl"
        />

        <CrmWorkOrderPresets
          active={filters.preset ?? (filters.repairStatus !== "all" ? "parts" : "all")}
          onApply={(patch) => setFilters({ ...filters, ...patch })}
        />
        <WorkOrderFilters filters={filters} onChange={setFilters} openOrdersOnly />

        <section>
          <h2 className="font-display uppercase text-sm text-bm-muted mb-3">{c.kanbanTitle}</h2>
          <WorkOrderKanban orders={filteredOrders} />
        </section>

        <div className="glass-red rounded-xl overflow-hidden neon-border">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{c.status}</th>
                <th>{t.wo.paymentMethodLabel}</th>
                <th>{c.date}</th>
                <th>{c.client}</th>
                <th>{c.vehicleColumn}</th>
                <th>{c.total}</th>
                <th>{t.document.documentStatus}</th>
                <th>{sig.adminSigned}</th>
                <th>{t.document.signLinkTitle}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const client = db.users.find((u) => u.id === order.userId);
                const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
                return (
                  <tr key={order.id} className="hover:bg-white/5">
                    <td className="font-mono text-bm-red">{order.number}</td>
                    <td>
                      <span className="status-pill bg-bm-red/20 text-bm-red text-[10px]">
                        {t.repairStatus[order.status]}
                      </span>
                    </td>
                    <td className="text-xs">
                      {order.paymentStatus === "paid" && order.paymentMethod ? (
                        <span className="text-green-400">{pm[order.paymentMethod]}</span>
                      ) : (
                        <span className="text-amber-400">{ps.unpaid}</span>
                      )}
                    </td>
                    <td>{order.createdAt}</td>
                    <td>{client?.name ?? "—"}</td>
                    <td>
                      <VehicleThumbnail vehicle={vehicle} />
                    </td>
                    <td className="font-mono">{calcClientTotal(order).toFixed(2)} zł</td>
                    <td>
                      <span
                        className={`status-pill text-[10px] ${
                          order.documentStatus === "awaiting_signature"
                            ? "doc-status-awaiting"
                            : order.documentStatus === "signed"
                              ? "doc-status-signed"
                              : order.documentStatus === "delivered"
                                ? "doc-status-delivered"
                                : order.documentStatus === "completed"
                                  ? "doc-status-completed"
                                  : "doc-status-progress"
                        }`}
                      >
                        {t.documentStatus[order.documentStatus ?? "awaiting_signature"]}
                      </span>
                    </td>
                    <td>
                      {order.confirmationStatus === "confirmed" ? (
                        <span className="text-[10px] text-green-400">
                          {sig.confirmed}
                          {order.signature?.signedAt && (
                            <span className="block text-bm-muted">
                              {new Date(order.signature.signedAt).toLocaleString()}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400">{sig.awaiting}</span>
                      )}
                    </td>
                    <td>
                      {client ? (
                        <SignLinkShareBlock order={order} client={client} inline />
                      ) : (
                        <span className="text-bm-muted text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setEditingId(order.id)}
                        className="text-bm-red hover:text-white p-2"
                        title={w.editOrder}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<div className="pt-28 text-center text-bm-muted">...</div>}>
      <WorkOrdersPageContent />
    </Suspense>
  );
}
