"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { WorkOrderHistoryPanel } from "@/components/crm/WorkOrderHistoryPanel";
import { useI18n } from "@/lib/i18n/context";
import { logoutAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default function OrderHistoryPage() {
  const { t } = useI18n();
  const c = t.crm;

  return (
    <DashboardLayout role="admin">
      <div className="crm-page-padding space-y-6 sm:space-y-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <Link href="/crm" className="text-sm text-bm-muted hover:text-bm-red">
              ← CRM
            </Link>
            <h1 className="font-display text-2xl font-bold uppercase text-glow mt-2">
              {c.orderHistoryList}
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              logoutAdmin();
            }}
          >
            <LogOut size={16} /> {c.logout}
          </Button>
        </div>
        <WorkOrderHistoryPanel />
      </div>
    </DashboardLayout>
  );
}
