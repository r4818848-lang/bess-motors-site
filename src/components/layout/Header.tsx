"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/lib/site";

const navPaths = [
  { href: "/", key: "home" as const },
  { href: "/services", key: "services" as const },
  { href: "/booking", key: "booking" as const },
  { href: "/cabinet", key: "cabinet" as const },
  { href: "/about", key: "about" as const },
  { href: "/contacts", key: "contacts" as const },
];

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-bm-border/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Logo size="sm" showTagline={false} />

        <nav className="hidden items-center gap-1 xl:flex">
          {navPaths.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm transition-all",
                pathname === href
                  ? "bg-bm-red/20 text-bm-red shadow-neon-sm"
                  : "text-bm-muted hover:text-white hover:bg-white/5"
              )}
            >
              {t.nav[key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher compact />
          <a href={siteConfig.phoneHref} className="btn-primary text-xs py-2 px-4">
            {t.hero.ctaCall}
          </a>
        </div>

        <button
          className="xl:hidden p-2 text-white"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="xl:hidden border-t border-bm-border glass px-4 py-4">
          <nav className="flex flex-col gap-2">
            {navPaths.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "rounded-lg px-4 py-3",
                  pathname === href ? "bg-bm-red/20 text-bm-red" : "text-bm-muted"
                )}
              >
                {t.nav[key]}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <LanguageSwitcher />
            <a href={siteConfig.phoneHref} className="btn-primary text-center">
              {siteConfig.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
