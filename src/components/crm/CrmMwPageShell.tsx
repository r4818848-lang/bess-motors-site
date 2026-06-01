"use client";

import Link from "next/link";
import { Home, Search } from "lucide-react";
import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import { CrmPageHeader, type CrmBreadcrumb } from "@/components/crm/CrmPageHeader";

type Props = {
  breadcrumbs: CrmBreadcrumb[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Primary blue action (e.g. create) */
  primaryAction?: React.ReactNode;
  /** Pink delete / secondary destructive */
  secondaryAction?: React.ReactNode;
  /** Icon links between actions and search */
  toolbarIcons?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  showPriceToggle?: boolean;
  filters?: React.ReactNode;
  className?: string;
};

export function CrmMwPageShell({
  breadcrumbs,
  title,
  subtitle,
  children,
  primaryAction,
  secondaryAction,
  toolbarIcons,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  showPriceToggle = true,
  filters,
  className,
}: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const { priceMode, setPriceMode } = useCrmDisplay();

  return (
    <div className={clsx("crm-page-padding space-y-4", className)}>
      <div className="crm-mw-page-top">
        <CrmPageHeader
          breadcrumbs={breadcrumbs}
          title={title}
          subtitle={subtitle}
          className="flex-1 min-w-0 mb-0"
        />
        {showPriceToggle && (
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
        )}
      </div>

      {(primaryAction || secondaryAction || toolbarIcons || onSearchChange) && (
        <div className="crm-mw-toolbar">
          {primaryAction}
          {secondaryAction}
          {toolbarIcons}
          {onSearchChange && (
            <div className="crm-mw-search w-full sm:w-auto sm:min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder ?? c.searchOrdersPlaceholder}
                aria-label={c.search}
              />
            </div>
          )}
        </div>
      )}

      {filters}
      {children}
    </div>
  );
}

/** Standard MW toolbar icon link */
export function CrmMwToolbarLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="crm-mw-toolbar-icon" title={title}>
      {children}
    </Link>
  );
}

export function CrmMwToolbarHome({ title }: { title: string }) {
  return (
    <CrmMwToolbarLink href="/crm/work-orders" title={title}>
      <Home size={18} />
    </CrmMwToolbarLink>
  );
}
