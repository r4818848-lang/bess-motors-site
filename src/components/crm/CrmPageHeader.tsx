"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export type CrmBreadcrumb = {
  label: string;
  href?: string;
};

type Props = {
  breadcrumbs: CrmBreadcrumb[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function CrmPageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
  className,
}: Props) {
  return (
    <div className={clsx("crm-page-header", className)}>
      <nav className="crm-breadcrumbs" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <ChevronRight size={14} className="text-bm-muted/60 shrink-0" />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-bm-red transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-bm-muted">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4 mt-2">
        <div className="min-w-0">
          <h1 className="crm-page-title">{title}</h1>
          {subtitle && <p className="crm-page-subtitle mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
