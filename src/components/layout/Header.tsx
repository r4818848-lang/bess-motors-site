"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/session-context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "@/components/brand/Logo";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";

const navPaths = [
  { href: "/", key: "home" as const },
  { href: "/services", key: "services" as const },
  { href: "/cennik", key: "priceList" as const },
  { href: "/gallery", key: "gallery" as const },
  { href: "/booking", key: "booking" as const },
  { href: "/cabinet", key: "cabinet" as const },
  { href: "/about", key: "about" as const },
  { href: "/contacts", key: "contacts" as const },
  { href: "/faq", key: "faq" as const },
];

export function Header() {
  const { t } = useI18n();
  const { isClientLoggedIn, clientUser } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-bm-border/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Logo size="sm" showTagline={false} />

        <nav className="hidden items-center gap-1 xl:flex">
          {navPaths.map(({ href, key }) => {
            const navClass = clsx(
              "rounded-lg px-3 py-2 text-sm transition-all relative",
              pathname === href
                ? "bg-bm-red/20 text-bm-red shadow-neon-sm"
                : "text-bm-muted hover:text-white hover:bg-white/5",
              href === "/cabinet" && isClientLoggedIn && "text-white"
            );
            const label =
              key === "cabinet" && isClientLoggedIn && clientUser
                ? clientUser.name.split(" ")[0] || t.nav.cabinet
                : t.nav[key];
            const badge =
              href === "/cabinet" && isClientLoggedIn ? (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              ) : null;
            if (href === "/booking") {
              return (
                <BookingLink key={href} href={href} trackSource="nav" className={navClass}>
                  {label}
                  {badge}
                </BookingLink>
              );
            }
            return (
              <Link key={href} href={href} className={navClass}>
                {label}
                {badge}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher compact />
          <PhoneLink trackSource="header" className="btn-primary text-xs py-2 px-4">
            {t.hero.ctaCall}
          </PhoneLink>
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
            {navPaths.map(({ href, key }) => {
              const mobileClass = clsx(
                "rounded-lg px-4 py-3",
                pathname === href ? "bg-bm-red/20 text-bm-red" : "text-bm-muted"
              );
              if (href === "/booking") {
                return (
                  <BookingLink
                    key={href}
                    href={href}
                    trackSource="nav_mobile"
                    onClick={() => setOpen(false)}
                    className={mobileClass}
                  >
                    {t.nav[key]}
                  </BookingLink>
                );
              }
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={mobileClass}
                >
                  {t.nav[key]}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <LanguageSwitcher />
            <PhoneLink trackSource="header_mobile" className="btn-primary text-center">
              {t.hero.ctaCall}
            </PhoneLink>
          </div>
        </div>
      )}
    </header>
  );
}
