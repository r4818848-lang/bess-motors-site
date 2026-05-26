"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  Wrench,
  Wallet,
  BarChart3,
  Settings,
  Calendar,
  CalendarDays,
  Flame,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useHotOrdersBadgeCount } from "@/components/crm/HotOrdersPanel";
import { useCloudAppointmentsSync } from "@/hooks/useCloudAppointmentsSync";
import { useCloudCrmSync } from "@/hooks/useCloudCrmSync";

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  tab?: string | null;
  path: string;
};

function DashboardLayoutInner({
  children,
  role = "admin",
}: {
  children: React.ReactNode;
  role?: "admin" | "mechanic";
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const c = t.crm;
  useCloudAppointmentsSync(role === "admin");
  useCloudCrmSync(role === "admin");
  const hotBadge = useHotOrdersBadgeCount();

  const adminNav: NavItem[] = [
    { href: "/crm", path: "/crm", icon: LayoutDashboard, label: c.dashboard, tab: null },
    { href: "/crm?tab=hot", path: "/crm", icon: Flame, label: c.hotOrders, tab: "hot" },
    { href: "/crm/work-orders", path: "/crm/work-orders", icon: FileText, label: c.workOrders },
    { href: "/crm/calendar", path: "/crm/calendar", icon: Calendar, label: t.calendar.title },
    { href: "/crm/appointments", path: "/crm/appointments", icon: CalendarDays, label: t.calendar.appointmentsTitle },
    { href: "/crm?tab=expenses", path: "/crm", icon: Wallet, label: t.wo.internalExpenses, tab: "expenses" },
    { href: "/crm?tab=reports", path: "/crm", icon: BarChart3, label: t.wo.reports, tab: "reports" },
    { href: "/crm?tab=settings", path: "/crm", icon: Settings, label: t.wo.settingsTitle, tab: "settings" },
    { href: "/mechanic", path: "/mechanic", icon: Wrench, label: c.mechanics },
  ];

  const mechanicNav: NavItem[] = [
    { href: "/mechanic", path: "/mechanic", icon: Wrench, label: t.mechanic.title },
    { href: "/mechanic?view=calendar", path: "/mechanic", icon: Calendar, label: t.calendar.title },
    { href: "/crm/work-orders", path: "/crm/work-orders", icon: FileText, label: c.workOrders },
  ];

  const items = role === "admin" ? adminNav : mechanicNav;

  const isActive = (item: NavItem) => {
    if (item.path === "/crm/work-orders") return pathname.startsWith("/crm/work-orders");
    if (item.path === "/crm/calendar") return pathname.startsWith("/crm/calendar");
    if (item.path === "/crm/appointments") return pathname.startsWith("/crm/appointments");
    if (item.path === "/mechanic") return pathname.startsWith("/mechanic");
    if (item.path === "/crm" && item.tab) return pathname === "/crm" && tab === item.tab;
    if (item.path === "/crm" && !item.tab) return pathname === "/crm" && !tab;
    return pathname === item.href;
  };

  return (
    <div className="pt-20 min-h-screen flex">
      <aside className="hidden lg:flex w-64 flex-col border-r border-bm-border bg-bm-graphite/80 glass shrink-0 fixed left-0 top-20 bottom-0 z-40">
        <div className="p-4 border-b border-bm-border">
          <p className="font-display text-xs uppercase tracking-widest text-bm-red">
            {role === "admin" ? "ERP" : "MECHANIC"}
          </p>
          <p className="font-display font-bold text-sm mt-1">
            {role === "admin" ? c.title : t.mechanic.title}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  isActive(item)
                    ? "bg-bm-red/20 text-bm-red shadow-neon-sm"
                    : "text-bm-muted hover:text-white hover:bg-bm-red/10"
                )}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.tab === "hot" && hotBadge > 0 && (
                  <span className="hot-badge-pulse min-w-[20px] h-5 px-1.5 rounded-full bg-bm-red text-[10px] font-bold flex items-center justify-center">
                    {hotBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-bm-border">
          <Link href="/" className="text-xs text-bm-muted hover:text-bm-red transition-colors">
            ← {t.nav.home}
          </Link>
        </div>
      </aside>
      <div className="flex-1 lg:ml-64 min-w-0">{children}</div>
    </div>
  );
}

export function DashboardLayout(props: {
  children: React.ReactNode;
  role?: "admin" | "mechanic";
}) {
  return (
    <Suspense
      fallback={
        <div className="pt-20 min-h-screen flex">
          <div className="flex-1 p-10 text-bm-muted">...</div>
        </div>
      }
    >
      <DashboardLayoutInner {...props} />
    </Suspense>
  );
}
