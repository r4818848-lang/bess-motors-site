"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { name: string; href?: string };

/** Visible breadcrumbs — Strona główna > Usługi > Nazwa */
export function SeoLandingBreadcrumbs({
  serviceTitle,
  serviceHref,
}: {
  serviceTitle: string;
  serviceHref: string;
}) {
  const crumbs: Crumb[] = [
    { name: "Strona główna", href: "/" },
    { name: "Usługi", href: "/services" },
    { name: serviceTitle, href: serviceHref },
  ];

  return (
    <nav aria-label="Breadcrumb" className="mb-8 text-sm text-bm-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.name} className="inline-flex items-center gap-1.5">
              {i > 0 ? <ChevronRight size={14} className="opacity-50" aria-hidden /> : null}
              {last || !c.href ? (
                <span className="text-bm-silver line-clamp-1" aria-current="page">
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-bm-red transition-colors">
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
