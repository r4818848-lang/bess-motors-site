"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Home,
  Calendar,
  Users,
  Car,
  Archive,
  RefreshCw,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { WorkOrderForm } from "@/components/crm/WorkOrderForm";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { isAdminAuthenticated, logoutAdmin } from "@/lib/auth";
import { loadDb, saveDb, type RepairStatus } from "@/lib/store";
import { filterWorkOrders, defaultWorkOrderFilters } from "@/lib/workorder-filters";
import { applyWorkOrderClosure, filterOpenWorkOrders } from "@/lib/work-order-lifecycle";
import { saveWorkOrderStatusAndSync } from "@/lib/work-order-status-update";
import {
  pullCrmFromCloud,
  pushCrmDelete,
  pushCrmSave,
} from "@/lib/cloud-crm-db";
import { isCrmDraftLockActive } from "@/lib/crm-draft-lock";
import { filterWorkOrdersByQuery } from "@/lib/crm-search";
import { WorkOrderFilters } from "@/components/crm/WorkOrderFilters";
import { WorkOrderKanban } from "@/components/crm/WorkOrderKanban";
import { useDbSync } from "@/hooks/useDbSync";
import { usePinnedWorkOrders } from "@/hooks/usePinnedWorkOrders";
import { CrmWorkOrderPresets } from "@/components/crm/CrmWorkOrderPresets";
import { QuickCreateOrderModal } from "@/components/crm/QuickCreateOrderModal";
import { WorkOrdersTable } from "@/components/crm/WorkOrdersTable";

function WorkOrdersPageContent() {
  const { t } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const { priceMode, setPriceMode } = useCrmDisplay();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const crmRole = isAdminAuthenticated() ? "admin" : "mechanic";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [kanbanOpen, setKanbanOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const dbTick = useDbSync();
  const [filters, setFilters] = useState(defaultWorkOrderFilters);
  const { isPinned, toggle: togglePin } = usePinnedWorkOrders();

  const refresh = useCallback(() => {
    if (isCrmDraftLockActive()) return;
    void (async () => {
      await pushCrmSave(loadDb());
      await pullCrmFromCloud({ force: true });
    })();
  }, []);

  const closeEditor = useCallback(() => {
    setEditingId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    params.delete("create");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [pathname, router, searchParams]);

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
    return [...bySearch].sort((a, b) => {
      const ap = isPinned(a.id) ? 0 : 1;
      const bp = isPinned(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [db, filters, searchQuery, dbTick, isPinned]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [filteredOrders.length, page, pageSize]);

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
    setSelectedIds(new Set(pagedOrders.map((o) => o.id)));
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${c.confirmDeleteSelected}\n\n${selectedIds.size}`)) return;
    const fresh = loadDb();
    fresh.workOrders = fresh.workOrders.filter((o) => !selectedIds.has(o.id));
    saveDb(fresh);
    const ok = await pushCrmDelete(fresh);
    if (!ok) return;
    setSelectedIds(new Set());
  };

  const markDelivered = async (orderId: string) => {
    if (!confirm(c.markDeliveredConfirm)) return;
    const ok = await saveWorkOrderStatusAndSync(orderId, "delivered");
    if (!ok) return;
    if (editingId === orderId) closeEditor();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  };

  const updateStatus = async (orderId: string, status: RepairStatus) => {
    const ok = await saveWorkOrderStatusAndSync(orderId, status);
    if (!ok) return;
    if (status === "delivered" && editingId === orderId) closeEditor();
  };

  if (editingId) {
    return (
      <DashboardLayout role={crmRole}>
        <div className="crm-page-padding">
          <WorkOrderForm
            orderId={editingId}
            onClose={closeEditor}
            onSaved={() => {
              closeEditor();
              refresh();
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={crmRole}>
      <div className="crm-page-padding space-y-4">
        <div className="crm-mw-page-top">
          <CrmPageHeader
            breadcrumbs={[
              { label: c.dashboard, href: "/crm" },
              { label: w.ordersTitle },
            ]}
            title={w.ordersTitle}
            className="flex-1 min-w-0 mb-0"
          />
          <div className="crm-price-toggle shrink-0" role="group" aria-label={c.priceDisplayMode}>
            <button
              type="button"
              className={priceMode === "net" ? "active" : ""}
              onClick={() => setPriceMode("net")}
            >
              {c.netto}
            </button>
            <button
              type="button"
              className={priceMode === "gross" ? "active" : ""}
              onClick={() => setPriceMode("gross")}
            >
              {c.brutto}
            </button>
          </div>
        </div>

        <div className="crm-mw-toolbar">
          <button
            type="button"
            className="crm-mw-btn-create"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={18} />
            {c.createOrder}
          </button>
          <button
            type="button"
            className="crm-mw-btn-delete"
            disabled={selectedIds.size === 0}
            onClick={deleteSelected}
          >
            <Trash2 size={16} />
            {c.deleteSelected}
          </button>
          <div className="crm-mw-toolbar-icons">
            <button
              type="button"
              className="crm-mw-toolbar-icon"
              onClick={() => refresh()}
              title={c.syncNow}
            >
              <RefreshCw size={18} />
            </button>
            {crmRole === "admin" && (
              <>
                <Link href="/crm/calendar" className="crm-mw-toolbar-icon" title={t.calendar.title}>
                  <Calendar size={18} />
                </Link>
                <Link href="/crm?tab=clients" className="crm-mw-toolbar-icon" title={c.navClients}>
                  <Users size={18} />
                </Link>
                <Link href="/crm?tab=vehicles" className="crm-mw-toolbar-icon" title={c.vehiclesList}>
                  <Car size={18} />
                </Link>
                <Link
                  href="/crm/order-history"
                  className="crm-mw-toolbar-icon"
                  title={c.orderHistoryList}
                >
                  <Archive size={18} />
                </Link>
                <Link href="/crm" className="crm-mw-toolbar-icon" title={c.dashboard}>
                  <Home size={18} />
                </Link>
              </>
            )}
            {crmRole === "mechanic" && (
              <Link href="/mechanic" className="crm-mw-toolbar-icon" title={t.mechanic.title}>
                <Home size={18} />
              </Link>
            )}
          </div>
          <div className="crm-mw-search w-full sm:w-auto sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={c.searchOrdersPlaceholder}
              aria-label={c.search}
            />
          </div>
        </div>

        <div className="crm-mw-filters-panel">
          <button
            type="button"
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <span>{c.kanbanTitle} / {c.openOrdersOnly}</span>
            {filtersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {filtersOpen && (
            <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
              <CrmWorkOrderPresets
                active={
                  filters.preset !== "all"
                    ? filters.preset
                    : filters.repairStatus === "waitingParts"
                      ? "parts"
                      : "all"
                }
                onApply={(patch) => setFilters({ ...filters, ...patch })}
              />
              <WorkOrderFilters filters={filters} onChange={setFilters} openOrdersOnly />
              <section className="rounded border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50"
                  onClick={() => setKanbanOpen((v) => !v)}
                >
                  <span>{c.kanbanTitle}</span>
                  {kanbanOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {kanbanOpen && (
                  <div className="p-3">
                    <WorkOrderKanban orders={filteredOrders} />
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        <WorkOrdersTable
          db={db}
          orders={pagedOrders}
          onEdit={(id) => setEditingId(id)}
          onStatusChange={updateStatus}
          onMarkDelivered={markDelivered}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          isPinned={isPinned}
          onTogglePin={togglePin}
          page={page}
          pageSize={pageSize}
          totalCount={filteredOrders.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
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
