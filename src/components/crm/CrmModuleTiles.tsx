"use client";

import Link from "next/link";
import {
  FileText,
  Flame,
  Users,
  Car,
  Calendar,
  Archive,
  Package,
  BarChart3,
  Wallet,
  History,
  Plus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const tiles: { href: string; icon: typeof FileText; label: (c: ReturnType<typeof useI18n>["t"]) => string; accent?: boolean }[] = [
  { href: "/crm/work-orders", icon: FileText, label: (t) => t.crm.workOrders, accent: true },
  { href: "/crm/work-orders?create=1", icon: Plus, label: (t) => t.crm.createOrder },
  { href: "/crm?tab=hot", icon: Flame, label: (t) => t.crm.hotOrders },
  { href: "/crm/calendar", icon: Calendar, label: (t) => t.calendar.title },
  { href: "/crm?tab=clients", icon: Users, label: (t) => t.crm.clientsList },
  { href: "/crm?tab=vehicles", icon: Car, label: (t) => t.crm.vehiclesList },
  { href: "/crm?tab=clientHistory", icon: History, label: (t) => t.crm.clientHistoryList },
  { href: "/crm/order-history", icon: Archive, label: (t) => t.crm.orderHistoryList },
  { href: "/crm?tab=warehouse", icon: Package, label: (t) => t.crm.warehouse },
  { href: "/crm?tab=reports", icon: BarChart3, label: (t) => t.wo.reports },
  { href: "/crm?tab=expenses", icon: Wallet, label: (t) => t.wo.internalExpenses },
];

export function CrmModuleTiles() {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
      {tiles.map(({ href, icon: Icon, label, accent }) => {
        const labelText = label(t);
        return (
          <Link
            key={href}
            href={href}
            className={`crm-module-tile group ${accent ? "accent" : ""}`}
          >
            <Icon
              size={28}
              className={`shrink-0 ${accent ? "text-bm-red" : "text-bm-muted group-hover:text-bm-red"}`}
            />
            <span className="text-center text-[11px] sm:text-xs font-bold uppercase tracking-wide leading-tight">
              {labelText}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
