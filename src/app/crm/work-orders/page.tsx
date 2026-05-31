"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, LogOut, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { WorkOrderForm } from "@/components/crm/WorkOrderForm";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmListToolbar } from "@/components/crm/CrmListToolbar";
import { logoutAdmin } from "@/lib/auth";
import { loadDb, saveDb } from "@/lib/store";
import { filterWorkOrders, defaultWorkOrderFilters } from "@/lib/workorder-filters";
import { filterOpenWorkOrders } from "@/lib/work-order-lifecycle";
import { filterWorkOrdersByQuery } from "@/lib/crm-search";
import { WorkOrderFilters } from "@/components/crm/WorkOrderFilters";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { Button } from "@/components/ui/Button";
import { WorkOrderKanban } from "@/components/crm/WorkOrderKanban";
import { useDbSync } from "@/hooks/useDbSync";
import { CrmWorkOrderPresets } from "@/components/crm/CrmWorkOrderPresets";
import { QuickCreateOrderModal } from "@/components/crm/QuickCreateOrderModal";
import { WorkOrdersTable } from "@/components/crm/WorkOrdersTable";
import Link from "next/link";

function WorkOrdersPageContent() {
  const { t } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [kanbanOpen, setKanbanOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const dbTick = useDbSync();
  const [filters, setFilters] = useState(defaultWorkOrderFilters);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(() => {}, []);

  useEffect(() => {
    const edit = searchParams.get("edit");
    if (edit) setEditingId(edit);
    if (searchParams.get("create") === "1") setCreateModalOpen(true);
  }, [searchParams]);

  const db = loadDb();
  void dbTick;
  const filteredOrders = useMemo(() => {
    const openOnly = filterOpenWorkOrders(db.workOrders);
    const byStatus = filterWorkOrders([...openOnly], filters);
    const bySearch = filterWorkOrdersByQuery(db, byStatus, searchQuery);
    return bySearch;
  }, [db, filters, searchQuery, dbTick]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${c.confirmDeleteSelected}\n\n${selectedIds.size}`)) return;
    const fresh = loadDb();
    fresh.workOrders = fresh.workOrders.filter((o) => !selectedIds.has(o.id));
    saveDb(fresh);
    setSelectedIds(new Set());
    refresh();
  };

  if (editingId) {
    return (
      <DashboardLayout role="admin">
        <div className="crm-page-padding">
          <WorkOrderForm
            orderId={editingId}
            onClose={() => setEditingId(null)}
            onSaved={() => {
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
      <div className="crm-page-padding space-y-5 sm:space-y-6">
        <CrmPageHeader
          breadcrumbs={[
            { label: c.dashboard, href: "/crm" },
            { label: w.ordersTitle },
          ]}
          title={w.ordersTitle}
          subtitle={`${c.openOrdersOnly} · ${filteredOrders.length}`}
          actions={
            <>
              <Link
                href="/crm/order-history"
                className="btn-outline text-xs py-2 inline-flex items-center gap-2 self-center"
              >
                {c.orderHistoryList}
              </Link>
              <Button onClick={() => setCreateModalOpen(true)}>
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
            </>
          }
        />

        <CrmListToolbar
          actions={
            selectedIds.size > 0 ? (
              <Button variant="outline" className="text-red-600 border-red-300" onClick={deleteSelected}>
                <Trash2 size={16} /> {c.deleteSelected} ({selectedIds.size})
              </Button>
            ) : null
          }
        >
          <CrmSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={c.search}
            className="max-w-full"
          />
        </CrmListToolbar>

        <CrmWorkOrderPresets
          active={filters.preset ?? (filters.repairStatus !== "all" ? "parts" : "all")}
          onApply={(patch) => setFilters({ ...filters, ...patch })}
        />
        <WorkOrderFilters filters={filters} onChange={setFilters} openOrdersOnly />

        <section className="crm-mw-card">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50"
            onClick={() => setKanbanOpen((v) => !v)}
          >
            <span>{c.kanbanTitle}</span>
            {kanbanOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {kanbanOpen && (
            <div className="p-3 border-t border-gray-200">
              <WorkOrderKanban orders={filteredOrders} />
            </div>
          )}
        </section>

        <WorkOrdersTable
          db={db}
          orders={filteredOrders}
          onEdit={(id) => setEditingId(id)}
          showExtended
          selectable
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />

        <QuickCreateOrderModal
          open={createModalOpen}
          initialUserId={searchParams.get("client")}
          onClose={() => setCreateModalOpen(false)}
          onCreated={(orderId) => {
            setCreateModalOpen(false);
            setEditingId(orderId);
          }}
        />
      </div>
    </DashboardLayout>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<div className="crm-page-padding text-bm-muted">...</div>}>
      <WorkOrdersPageContent />
    </Suspense>
  );
}
