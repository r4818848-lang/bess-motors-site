"use client";

import { Suspense, useEffect, useState } from "react";
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
  Archive,
  Users,
  History as HistoryIcon,
  Car,
  Menu,
  X,
  MoreHorizontal,
  Package,
  TrendingUp,
  Moon,
  Sun,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import { useHotOrdersBadgeCount } from "@/components/crm/HotOrdersPanel";
import { useCloudAppointmentsSync } from "@/hooks/useCloudAppointmentsSync";
import { useCloudCrmSync } from "@/hooks/useCloudCrmSync";
import { useCrmDraftLockActive } from "@/hooks/useCrmDraftLockActive";
import { DB_STORAGE_QUOTA_EVENT } from "@/lib/db-events";

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  tab?: string | null;
  path: string;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

function NavSections({
  sections,
  isActive,
  hotBadge,
  onNavigate,
  className,
}: {
  sections: NavSection[];
  isActive: (item: NavItem) => boolean;
  hotBadge: number;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={clsx("space-y-4", className)}>
      {sections.map((section, si) => (
        <div key={si}>
          {section.title && (
            <p className="crm-nav-section">{section.title}</p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={clsx(
                    "crm-nav-link",
                    isActive(item) && "active"
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{item.label}</span>
                  {item.tab === "hot" && hotBadge > 0 && (
                    <span className="hot-badge-pulse min-w-[20px] h-5 px-1.5 rounded-full bg-bm-red text-[10px] font-bold flex items-center justify-center shrink-0 text-white">
                      {hotBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

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
  const { theme, toggleTheme } = useCrmDisplay();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storageQuotaExceeded, setStorageQuotaExceeded] = useState(false);
  useCloudAppointmentsSync(role === "admin");

  useEffect(() => {
    const onQuota = () => setStorageQuotaExceeded(true);
    window.addEventListener(DB_STORAGE_QUOTA_EVENT, onQuota);
    return () => window.removeEventListener(DB_STORAGE_QUOTA_EVENT, onQuota);
  }, []);
  const {
    syncing,
    syncFailed,
    cloudConfigured,
    pushFailed,
    lastSyncedAt,
    syncFailureReason,
    resync,
  } = useCloudCrmSync(role === "admin" || role === "mechanic");

  const syncErrorLabel = (() => {
    if (syncFailureReason === "unauthorized") return c.syncRelogin;
    if (syncFailureReason === "timeout") return c.syncTimeout;
    if (syncFailureReason === "network") return c.syncNetwork;
    if (syncFailureReason === "cloud_off") return c.cloudNotConfigured;
    if (syncFailureReason === "draft_locked") return c.syncPausedDraft;
    return pushFailed ? c.pushSyncFailed : c.syncFailed;
  })();
  const draftLockActive = useCrmDraftLockActive();
  const hotBadge = useHotOrdersBadgeCount();

  const adminSections: NavSection[] = [
    {
      title: c.navOrders,
      items: [
        { href: "/crm/work-orders", path: "/crm/work-orders", icon: FileText, label: c.workOrders },
        { href: "/crm?tab=hot", path: "/crm", icon: Flame, label: c.hotOrders, tab: "hot" },
        { href: "/crm/order-history", path: "/crm/order-history", icon: Archive, label: c.orderHistoryList },
        { href: "/crm/calendar", path: "/crm/calendar", icon: Calendar, label: t.calendar.title },
        { href: "/crm/appointments", path: "/crm/appointments", icon: CalendarDays, label: t.calendar.appointmentsTitle },
      ],
    },
    {
      title: c.navClients,
      items: [
        { href: "/crm?tab=clients", path: "/crm", icon: Users, label: c.clientsList, tab: "clients" },
        { href: "/crm?tab=vehicles", path: "/crm", icon: Car, label: c.vehiclesList, tab: "vehicles" },
        { href: "/crm?tab=clientHistory", path: "/crm", icon: HistoryIcon, label: c.clientHistoryList, tab: "clientHistory" },
        { href: "/crm?tab=vehicleChanges", path: "/crm", icon: HistoryIcon, label: c.vehicleChangesHistory, tab: "vehicleChanges" },
      ],
    },
    {
      title: c.navWarehouse,
      items: [
        { href: "/crm?tab=warehouse", path: "/crm", icon: Package, label: c.warehouse, tab: "warehouse" },
      ],
    },
    {
      title: c.navFinance,
      items: [
        { href: "/crm?tab=expenses", path: "/crm", icon: Wallet, label: t.wo.internalExpenses, tab: "expenses" },
        { href: "/crm?tab=reports", path: "/crm", icon: BarChart3, label: t.wo.reports, tab: "reports" },
        { href: "/crm?tab=marketing", path: "/crm", icon: TrendingUp, label: c.marketing, tab: "marketing" },
      ],
    },
    {
      title: c.navSystem,
      items: [
        { href: "/crm?tab=settings", path: "/crm", icon: Settings, label: t.wo.settingsTitle, tab: "settings" },
        { href: "/crm?tab=settings", path: "/crm", icon: Wrench, label: c.mechanics, tab: "settings" },
      ],
    },
  ];

  const mechanicNav: NavItem[] = [
    { href: "/mechanic", path: "/mechanic", icon: Wrench, label: t.mechanic.title },
    { href: "/mechanic?view=calendar", path: "/mechanic", icon: Calendar, label: t.calendar.title },
    { href: "/crm/work-orders", path: "/crm/work-orders", icon: FileText, label: c.workOrders },
  ];

  const mechanicSections: NavSection[] = [{ items: mechanicNav }];

  const isActive = (item: NavItem) => {
    if (item.path === "/crm/work-orders") return pathname.startsWith("/crm/work-orders");
    if (item.path === "/crm/order-history") return pathname.startsWith("/crm/order-history");
    if (item.path === "/crm/calendar") return pathname.startsWith("/crm/calendar");
    if (item.path === "/crm/appointments") return pathname.startsWith("/crm/appointments");
    if (item.path === "/mechanic") return pathname.startsWith("/mechanic");
    if (item.path === "/crm" && item.tab === "vehicles")
      return pathname === "/crm" && tab === "vehicles";
    if (item.path === "/crm" && item.tab === "clientHistory")
      return pathname === "/crm" && tab === "clientHistory";
    if (item.path === "/crm" && item.tab === "vehicleChanges")
      return pathname === "/crm" && tab === "vehicleChanges";
    if (item.path === "/crm" && item.tab === "clients")
      return pathname === "/crm" && tab === "clients";
    if (item.path === "/crm" && item.tab === "warehouse")
      return pathname === "/crm" && tab === "warehouse";
    if (item.path === "/crm" && item.tab === "marketing")
      return pathname === "/crm" && tab === "marketing";
    if (item.path === "/crm" && item.tab) return pathname === "/crm" && tab === item.tab;
    if (item.path === "/crm" && !item.tab) return pathname === "/crm" && !tab;
    return pathname === item.href;
  };

  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname, tab]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  type BottomNavItem = {
    href: string;
    icon: typeof LayoutDashboard;
    label: string;
    match: () => boolean;
    badge?: number;
  };

  const adminBottomNav: BottomNavItem[] = [
    { href: "/crm", icon: LayoutDashboard, label: c.dashboard, match: () => pathname === "/crm" && !tab },
    { href: "/crm/work-orders", icon: FileText, label: c.workOrders, match: () => pathname.startsWith("/crm/work-orders") },
    { href: "/crm?tab=hot", icon: Flame, label: c.hotOrders, match: () => pathname === "/crm" && tab === "hot", badge: hotBadge },
    { href: "/crm/calendar", icon: Calendar, label: t.calendar.title, match: () => pathname.startsWith("/crm/calendar") },
  ];

  const mechanicBottomNav: BottomNavItem[] = [
    { href: "/mechanic", icon: Wrench, label: t.mechanic.title, match: () => pathname.startsWith("/mechanic") && !searchParams.get("view") },
    { href: "/crm/work-orders", icon: FileText, label: c.workOrders, match: () => pathname.startsWith("/crm/work-orders") },
    { href: "/mechanic?view=calendar", icon: Calendar, label: t.calendar.title, match: () => pathname.startsWith("/mechanic") && searchParams.get("view") === "calendar" },
  ];

  const bottomNav = role === "admin" ? adminBottomNav : mechanicBottomNav;
  const panelTitle = role === "admin" ? c.title : t.mechanic.title;
  const sections = role === "admin" ? adminSections : mechanicSections;

  const syncFooter = (role === "admin" || role === "mechanic") && (
    <div className="text-[10px] uppercase tracking-wide">
      {syncing ? (
        <span className="text-bm-muted">{c.syncing}</span>
      ) : !cloudConfigured ? (
        <span className="text-amber-400">{c.cloudNotConfigured}</span>
      ) : syncFailed || pushFailed ? (
        <button
          type="button"
          className="text-amber-400 hover:text-bm-red"
          onClick={() => void resync({ pull: true })}
        >
          {syncErrorLabel} · {c.syncNow}
        </button>
      ) : (
        <span className="text-green-500" title={lastSyncedAt ?? undefined}>
          {c.cloudSynced}
          {lastSyncedAt
            ? ` · ${new Date(lastSyncedAt).toLocaleString(undefined, {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : null}
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile top bar */}
      <header className="crm-mobile-header lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur safe-area-pt">
        <div className="flex items-center gap-2 px-3 py-2.5 min-h-[3.25rem]">
          <button
            type="button"
            className="p-2 -ml-1 rounded-lg hover:bg-white/10 text-white"
            onClick={() => setDrawerOpen(true)}
            aria-label={c.mobileMenu}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[10px] uppercase tracking-widest text-bm-red leading-none">
              {role === "admin" ? "ERP" : "MECHANIC"}
            </p>
            <p className="font-display font-bold text-sm truncate text-white">{panelTitle}</p>
          </div>
          <Link href="/" className="text-xs text-bm-muted hover:text-bm-red px-2 py-1 shrink-0">
            {t.nav.home}
          </Link>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <button
            type="button"
            className="flex-1 bg-black/50"
            aria-label="Close"
            onClick={closeDrawer}
          />
          <aside className="crm-sidebar w-[min(100%,18.5rem)] max-w-full flex flex-col border-l safe-area-pt safe-area-pb">
            <div className="flex items-center justify-between p-4 border-b border-bm-border">
              <div className="min-w-0">
                <p className="font-display text-xs uppercase tracking-widest text-bm-red">
                  {role === "admin" ? "ERP" : "MECHANIC"}
                </p>
                <p className="font-display font-bold text-sm truncate">{panelTitle}</p>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/10 shrink-0 text-white"
                onClick={closeDrawer}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavSections
                sections={sections}
                isActive={isActive}
                hotBadge={hotBadge}
                onNavigate={closeDrawer}
              />
            </div>
            <div className="p-3 border-t border-bm-border space-y-2">
              {syncFooter}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  closeDrawer();
                }}
                className="crm-nav-link w-full justify-center text-xs"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                <span>{theme === "dark" ? c.themeLight : c.themeDark}</span>
              </button>
              <Link
                href="/"
                onClick={closeDrawer}
                className="text-xs text-bm-muted hover:text-bm-red transition-colors block"
              >
                ← {t.nav.home}
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="crm-sidebar hidden lg:flex w-64 flex-col border-r shrink-0 fixed left-0 top-0 bottom-0 z-40">
        <div className="p-4 border-b border-bm-border">
          <p className="font-display text-xs uppercase tracking-widest text-bm-red">
            {role === "admin" ? "ERP · BESS MOTORS" : "MECHANIC"}
          </p>
          <p className="font-display font-bold text-sm mt-1 truncate">{panelTitle}</p>
        </div>
        <div className="flex-1 p-3 overflow-y-auto">
          <NavSections sections={sections} isActive={isActive} hotBadge={hotBadge} />
        </div>
        <div className="p-3 border-t border-bm-border space-y-2">
          {syncFooter}
          <button
            type="button"
            onClick={toggleTheme}
            className="crm-nav-link w-full justify-center text-xs"
            title={theme === "dark" ? c.themeLight : c.themeDark}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === "dark" ? c.themeLight : c.themeDark}</span>
          </button>
          <Link href="/" className="text-xs text-bm-muted hover:text-bm-red transition-colors block">
            ← {t.nav.home}
          </Link>
        </div>
      </aside>

      <div className="crm-main flex-1 lg:ml-64 min-w-0 w-full pt-[3.25rem] lg:pt-0 pb-[4.25rem] lg:pb-0">
        {storageQuotaExceeded && (
          <div className="crm-sync-banner border-amber-500/50" role="alert">
            <span>{c.storageQuotaExceeded}</span>
          </div>
        )}
        {draftLockActive && (
          <div className="crm-sync-banner border-bm-red/40" role="status">
            <span>{c.syncPausedDraft}</span>
          </div>
        )}
        {(syncFailed || pushFailed) && !syncing && cloudConfigured && !draftLockActive && (
          <div className="crm-sync-banner" role="status">
            <span>{syncErrorLabel}</span>
            <button type="button" onClick={() => void resync({ pull: true })}>
              {c.syncNow}
            </button>
          </div>
        )}
        {children}
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="crm-mobile-nav lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur safe-area-pb"
        aria-label="CRM"
      >
        <div className="flex items-stretch justify-around min-h-[3.5rem]">
          {bottomNav.map(({ href, icon: Icon, label, match, badge }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold uppercase tracking-wide min-w-0",
                match() ? "text-bm-red" : "text-bm-muted"
              )}
            >
              <span className="relative">
                <Icon size={20} />
                {badge && badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-bm-red text-[9px] font-bold flex items-center justify-center text-white">
                    {badge}
                  </span>
                ) : null}
              </span>
              <span className="truncate max-w-full px-0.5">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={clsx(
              "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold uppercase tracking-wide min-w-0",
              drawerOpen ? "text-bm-red" : "text-bm-muted"
            )}
          >
            <MoreHorizontal size={20} />
            <span>{c.mobileMenu}</span>
          </button>
        </div>
      </nav>
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
        <div className="min-h-screen flex">
          <div className="flex-1 crm-page-padding text-bm-muted">...</div>
        </div>
      }
    >
      <DashboardLayoutInner {...props} />
    </Suspense>
  );
}
