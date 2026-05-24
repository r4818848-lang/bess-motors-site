"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut, FileText, Wallet, BarChart3, Receipt, Settings, Flame, Users, History } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { ExpensesPanel } from "@/components/crm/ExpensesPanel";
import { FinanceReports } from "@/components/crm/FinanceReports";
import { SettingsPanel } from "@/components/crm/SettingsPanel";
import { HotOrdersPanel } from "@/components/crm/HotOrdersPanel";
import { ClientsListPanel } from "@/components/crm/ClientsListPanel";
import { VehicleHistoryPanel } from "@/components/crm/VehicleHistoryPanel";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { loadDb } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { filterWorkOrdersByQuery } from "@/lib/crm-search";
import { logoutAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type CrmTab = "overview" | "hot" | "clients" | "vehicles" | "expenses" | "reports" | "settings";

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
    if (
      q === "hot" ||
      q === "clients" ||
      q === "vehicles" ||
      q === "expenses" ||
      q === "reports" ||
      q === "settings"
    ) {
      setTab(q);
    } else {
      setTab("overview");
    }
  }, [searchParams]);

  const selectTab = (id: CrmTab) => {
    setTab(id);
    router.replace(id === "overview" ? "/crm" : `/crm?tab=${id}`);
  };

  const db = loadDb();

  const filteredOrders = useMemo(() => {
    const fresh = loadDb();
    const orders = filterWorkOrdersByQuery(fresh, fresh.workOrders, search);
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [search, dbTick]);

  const totalRevenue = db.workOrders.reduce((s, o) => s + calcClientTotal(o), 0);

  const navTabs = [
    { id: "overview" as const, icon: FileText, label: c.dashboard },
    { id: "hot" as const, icon: Flame, label: c.hotOrders },
    { id: "clients" as const, icon: Users, label: c.clientsList },
    { id: "vehicles" as const, icon: History, label: c.vehicleHistoryList },
    { id: "expenses" as const, icon: Wallet, label: t.wo.internalExpenses },
    { id: "reports" as const, icon: BarChart3, label: t.wo.reports },
    { id: "settings" as const, icon: Settings, label: t.wo.settingsTitle },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="p-6 lg:p-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold uppercase text-glow">{c.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/crm/work-orders" className="btn-primary text-xs py-2">
              <Receipt size={16} /> {t.wo.ordersTitle}
            </Link>
            <Button variant="outline" onClick={() => { logoutAdmin(); refresh(); }}>
              <LogOut size={16} /> {c.logout}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {navTabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                tab === id ? "bg-bm-red shadow-neon-sm" : "glass text-bm-muted"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <CrmSearchInput value={search} onChange={setSearch} placeholder={c.search} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: c.clients, value: db.users.filter((u) => u.role === "client").length },
                { label: c.workOrders, value: db.workOrders.length },
                { label: c.appointments, value: db.appointments.length },
                { label: c.revenue, value: `${totalRevenue.toLocaleString()} zł` },
              ].map((kpi, i) => (
                <Card key={i} glow className="text-center py-6">
                  <p className="text-xs uppercase text-bm-muted">{kpi.label}</p>
                  <p className="font-display text-2xl font-bold text-bm-red mt-2">{kpi.value}</p>
                </Card>
              ))}
            </div>

            <section className="glass-red rounded-xl overflow-hidden neon-border">
              <div className="px-4 py-3 border-b border-bm-border bg-bm-red/10 font-display text-sm uppercase font-bold flex justify-between">
                <span>{c.currentOrders}</span>
                <Link href="/crm/work-orders" className="text-bm-red text-xs hover:underline">
                  + {c.createOrder}
                </Link>
              </div>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{c.status}</th>
                    <th>{c.client}</th>
                    <th>{c.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 10).map((order) => {
                    const client = db.users.find((u) => u.id === order.userId);
                    return (
                      <tr key={order.id}>
                        <td className="font-mono text-bm-red">{order.number}</td>
                        <td>
                          <span className="status-pill bg-bm-red/20 text-bm-red text-[10px]">
                            {t.repairStatus[order.status]}
                          </span>
                        </td>
                        <td>{client?.name}</td>
                        <td className="font-mono">{calcClientTotal(order).toFixed(2)} zł</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

          </>
        )}

        {tab === "hot" && <HotOrdersPanel onUpdate={refresh} />}

        {tab === "clients" && <ClientsListPanel />}

        {tab === "vehicles" && <VehicleHistoryPanel />}

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
