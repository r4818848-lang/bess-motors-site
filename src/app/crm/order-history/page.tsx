"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { Plus, Search, Calendar, Users, Car, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { WorkOrderHistoryPanel } from "@/components/crm/WorkOrderHistoryPanel";
import { CrmMwPageShell, CrmMwToolbarLink } from "@/components/crm/CrmMwPageShell";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { filterClosedWorkOrders } from "@/lib/work-order-lifecycle";
import { filterWorkOrdersByQuery } from "@/lib/crm-search";
import { useDbSync } from "@/hooks/useDbSync";

function OrderHistoryContent() {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const [searchQuery, setSearchQuery] = useState("");
  const dbTick = useDbSync();
  const db = loadDb();
  void dbTick;

  const count = useMemo(() => {
    const closed = filterClosedWorkOrders(db.workOrders);
    return filterWorkOrdersByQuery(db, closed, searchQuery).length;
  }, [db, searchQuery, dbTick]);

  return (
    <CrmMwPageShell
      breadcrumbs={[
        { label: c.dashboard, href: "/crm/work-orders" },
        { label: c.orderHistoryList },
      ]}
      title={c.orderHistoryList}
      subtitle={c.orderHistoryHint}
      primaryAction={
        <Link href="/crm/work-orders?create=1" className="crm-mw-btn-create">
          <Plus size={18} />
          {c.createOrder}
        </Link>
      }
      toolbarIcons={
        <>
          <CrmMwToolbarLink href="/crm/calendar" title={t.calendar.title}>
            <Calendar size={18} />
          </CrmMwToolbarLink>
          <CrmMwToolbarLink href="/crm?tab=clients" title={c.navClients}>
            <Users size={18} />
          </CrmMwToolbarLink>
          <CrmMwToolbarLink href="/crm?tab=vehicles" title={c.vehiclesList}>
            <Car size={18} />
          </CrmMwToolbarLink>
          <CrmMwToolbarLink href="/crm/work-orders" title={w.ordersTitle}>
            <FileText size={18} />
          </CrmMwToolbarLink>
        </>
      }
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <p className="text-sm text-bm-muted mb-2">
        {count} {c.allOrders.toLowerCase()}
      </p>
      <WorkOrderHistoryPanel searchQuery={searchQuery} />
    </CrmMwPageShell>
  );
}

export default function OrderHistoryPage() {
  return (
    <DashboardLayout role="admin">
      <Suspense fallback={<div className="crm-page-padding text-bm-muted">...</div>}>
        <OrderHistoryContent />
      </Suspense>
    </DashboardLayout>
  );
}
