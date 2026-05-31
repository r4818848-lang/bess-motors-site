"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { AppointmentsList } from "@/components/crm/AppointmentsList";
import { logoutAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

function AppointmentsPageContent() {
  const { t } = useI18n();
  const c = t.crm;
  const refresh = useCallback(() => {}, []);

  return (
    <DashboardLayout role="admin">
      <div className="crm-page-padding space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <Link href="/crm" className="text-sm text-bm-muted hover:text-bm-red">
            ← CRM
          </Link>
          <Button variant="outline" onClick={() => { logoutAdmin(); refresh(); }}>
            <LogOut size={16} /> {c.logout}
          </Button>
        </div>
        <AppointmentsList />
      </div>
    </DashboardLayout>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="pt-28 text-center text-bm-muted">...</div>}>
      <AppointmentsPageContent />
    </Suspense>
  );
}
