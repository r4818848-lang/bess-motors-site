"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { AdminLogin } from "@/components/crm/AdminLogin";
import { AppointmentCalendar } from "@/components/crm/AppointmentCalendar";
import { isAdminAuthenticated, logoutAdmin, restoreSessionFromToken } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

function CalendarPageContent() {
  const { t } = useI18n();
  const c = t.crm;
  const [authed, setAuthed] = useState(false);

  const refresh = useCallback(() => setAuthed(isAdminAuthenticated()), []);

  useEffect(() => {
    restoreSessionFromToken().finally(refresh);
  }, [refresh]);

  if (!authed) return <AdminLogin onSuccess={refresh} />;

  return (
    <DashboardLayout role="admin">
      <div className="p-6 lg:p-10 space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <Link href="/crm" className="text-sm text-bm-muted hover:text-bm-red">
            ← CRM
          </Link>
          <Button variant="outline" onClick={() => { logoutAdmin(); refresh(); }}>
            <LogOut size={16} /> {c.logout}
          </Button>
        </div>
        <AppointmentCalendar role="admin" />
      </div>
    </DashboardLayout>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="pt-28 text-center text-bm-muted">...</div>}>
      <CalendarPageContent />
    </Suspense>
  );
}
