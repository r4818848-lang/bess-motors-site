"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut, Plus, UserPlus, Receipt } from "lucide-react";
import { WorkOrderHistoryPanel } from "@/components/crm/WorkOrderHistoryPanel";
import { ClientHistoryPanel } from "@/components/crm/ClientHistoryPanel";
import { filterOpenWorkOrders } from "@/lib/work-order-lifecycle";
import { WarehousePanel } from "@/components/crm/WarehousePanel";
import {
  ClientsCsvExport,
  InactiveClientsExport,
  FunnelPanel,
  MarketingAttributionPanel,
  ReferralDashboard,
} from "@/components/crm/MarketingPanels";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmListToolbar } from "@/components/crm/CrmListToolbar";
import { ExpensesPanel } from "@/components/crm/ExpensesPanel";
import { FinanceReports } from "@/components/crm/FinanceReports";
import { SettingsPanel } from "@/components/crm/SettingsPanel";
import { CrmBroadcastPanel } from "@/components/crm/CrmBroadcastPanel";
import { HotOrdersPanel } from "@/components/crm/HotOrdersPanel";
import { ClientsListPanel } from "@/components/crm/ClientsListPanel";
import { VehicleHistoryPanel } from "@/components/crm/VehicleHistoryPanel";
import { VehiclesListPanel } from "@/components/crm/VehiclesListPanel";
import { CrmModuleTiles } from "@/components/crm/CrmModuleTiles";
import { WorkOrdersTable } from "@/components/crm/WorkOrdersTable";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { loadDb } from "@/lib/store";
import { displayOrderTotal } from "@/lib/crm-display-price";
import { filterWorkOrdersByQuery } from "@/lib/crm-search";
import { logoutAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CrmTodayPanel } from "@/components/crm/CrmTodayPanel";

type CrmTab =
  | "overview"
  | "hot"
  | "clients"
  | "vehicles"
  | "vehicleChanges"
  | "clientHistory"
  | "orderHistory"
  | "warehouse"
  | "marketing"
  | "expenses"
  | "reports"
  | "settings";

function tabTitle(tab: CrmTab, c: ReturnType<typeof useI18n>["t"]["crm"], wo: ReturnType<typeof useI18n>["t"]["wo"]): string {
  switch (tab) {
    case "hot":
      return c.hotOrders;
    case "clients":
      return c.clientsList;
    case "vehicles":
      return c.vehiclesList;
    case "vehicleChanges":
      return c.vehicleChangesHistory;
    case "clientHistory":
      return c.clientHistoryList;
    case "orderHistory":
      return c.orderHistoryList;
    case "warehouse":
      return c.warehouse;
    case "marketing":
      return c.marketing;
    case "expenses":
      return wo.internalExpenses;
    case "reports":
      return wo.reports;
    case "settings":
      return wo.settingsTitle;
    default:
      return c.dashboard;
  }
}

function tabSubtitle(tab: CrmTab, c: ReturnType<typeof useI18n>["t"]["crm"]): string | undefined {
  switch (tab) {
    case "clientHistory":
      return c.clientHistoryHint;
    case "vehicles":
      return c.vehiclesListHint;
    case "orderHistory":
      return c.orderHistoryHint;
    case "hot":
      return c.hotOrdersHint;
    default:
      return undefined;
  }
}

function CRMPageContent() {
  const { t } = useI18n();
  const c = t.crm;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<CrmTab>("overview");
  const [search, setSearch] = useState("");
  const dbTick = useDbSync();
  const refresh = useCallback(() => {}, []);

  void dbTick;

  useEffect(() => {
    const q = searchParams.get("tab");
    if (q === "orderHistory") {
      router.replace("/crm/order-history");
      return;
    }
    if (
      q === "hot" ||
      q === "clients" ||
      q === "vehicles" ||
      q === "vehicleChanges" ||
      q === "clientHistory" ||
      q === "warehouse" ||
      q === "marketing" ||
      q === "expenses" ||
      q === "reports" ||
      q === "settings"
    ) {
      setTab(q);
    } else if (!q) {
      router.replace("/crm/work-orders");
    }
  }, [searchParams, router]);

  const db = loadDb();
  const vatRate = db.settings.vatRate ?? 23;

  const filteredOrders = useMemo(() => {
    const fresh = loadDb();
    const orders = filterWorkOrdersByQuery(fresh, filterOpenWorkOrders(fresh.workOrders), search);
    return orders.sort((a, b) => {
      const byCreated = b.createdAt.localeCompare(a.createdAt);
      if (byCreated !== 0) return byCreated;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [search, dbTick]);

  const totalRevenue = db.workOrders.reduce(
    (s, o) => s + displayOrderTotal(o, "gross", vatRate),
    0
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const appointmentsToday = db.appointments.filter(
    (a) => a.date === todayStr && a.appointmentStatus !== "cancelled"
  ).length;
  const inProgressOrders = db.workOrders.filter(
    (o) => o.status !== "ready" && o.status !== "delivered"
  ).length;

  const pageTitle = tabTitle(tab, c, t.wo);
  const pageSubtitle = tab === "overview" ? c.title : tabSubtitle(tab, c);

  return (
    <DashboardLayout role="admin">
      <div className="crm-page-padding space-y-5 sm:space-y-6">
        <CrmPageHeader
          breadcrumbs={[
            { label: c.dashboard, href: tab === "overview" ? undefined : "/crm" },
            ...(tab !== "overview" ? [{ label: pageTitle }] : []),
          ]}
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={
            <>
              <Link href="/crm/work-orders?create=1" className="crm-mw-btn-create text-xs py-2 inline-flex items-center gap-2">
                <Plus size={16} /> {c.createOrder}
              </Link>
              {tab === "overview" && (
                <button
                  type="button"
                  onClick={() => router.replace("/crm?tab=clients")}
                  className="btn-outline text-xs py-2 inline-flex items-center gap-2"
                >
                  <UserPlus size={16} /> {c.addNewClient}
                </button>
              )}
              <Link href="/crm/work-orders" className="btn-outline text-xs py-2 inline-flex items-center gap-2">
                <Receipt size={16} /> {t.wo.ordersTitle}
              </Link>
              <Button variant="outline" onClick={() => { logoutAdmin(); refresh(); }}>
                <LogOut size={16} /> {c.logout}
              </Button>
            </>
          }
        />

        {tab === "overview" && (
          <>
            <CrmModuleTiles />
            <CrmTodayPanel />
            <CrmListToolbar showPriceToggle>
              <CrmSearchInput
                value={search}
                onChange={setSearch}
                placeholder={c.searchClients}
                className="max-w-full"
              />
            </CrmListToolbar>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: c.clients, value: db.users.filter((u) => u.role === "client").length },
                { label: c.workOrders, value: db.workOrders.length },
                { label: c.appointments, value: db.appointments.length },
                { label: c.appointmentsToday, value: appointmentsToday },
                { label: c.inProgress, value: inProgressOrders },
                { label: c.revenue, value: `${totalRevenue.toLocaleString()} zł` },
              ].map((kpi, i) => (
                <Card key={i} glow className="text-center py-5 sm:py-6">
                  <p className="text-xs uppercase text-bm-muted">{kpi.label}</p>
                  <p className="font-display text-xl sm:text-2xl font-bold text-bm-red mt-2">{kpi.value}</p>
                </Card>
              ))}
            </div>

            <section>
              <div className="flex justify-between items-center gap-2 mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-bm-muted">
                  {c.currentOrders}
                </h2>
                <Link href="/crm/work-orders" className="text-bm-red text-xs hover:underline font-semibold">
                  {c.allOrders} →
                </Link>
              </div>
              <WorkOrdersTable
                db={db}
                orders={filteredOrders.slice(0, 15)}
                onEdit={(id) => router.push(`/crm/work-orders?edit=${encodeURIComponent(id)}`)}
                showExtended={false}
              />
            </section>
          </>
        )}

        {tab === "hot" && <HotOrdersPanel onUpdate={refresh} />}
        {tab === "clients" && <ClientsListPanel />}
        {tab === "clientHistory" && <ClientHistoryPanel />}
        {tab === "vehicles" && <VehiclesListPanel />}
        {tab === "vehicleChanges" && <VehicleHistoryPanel />}
        {tab === "warehouse" && <WarehousePanel />}
        {tab === "marketing" && (
          <div className="space-y-8">
            <CrmBroadcastPanel />
            <div className="flex flex-wrap gap-2">
              <ClientsCsvExport />
              <InactiveClientsExport />
            </div>
            <FunnelPanel />
            <ReferralDashboard />
            <MarketingAttributionPanel />
          </div>
        )}
        {tab === "expenses" && <ExpensesPanel onUpdate={refresh} />}
        {tab === "reports" && <FinanceReports />}
        {tab === "settings" && <SettingsPanel onUpdate={refresh} />}
      </div>
    </DashboardLayout>
  );
}

function CrmLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 rounded-full border-2 border-bm-red border-t-transparent animate-spin" />
    </div>
  );
}

export default function CRMPage() {
  return (
    <Suspense fallback={<CrmLoadingFallback />}>
      <CRMPageContent />
    </Suspense>
  );
}
