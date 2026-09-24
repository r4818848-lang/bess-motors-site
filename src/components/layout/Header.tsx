"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "@/components/brand/Logo";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { SITE_NAP } from "@/lib/site-nap";

/** Simplified nav — TZ §7–8 */
const desktopNav = [
  { href: "/services", key: "services" as const },
  { href: "/cennik", key: "priceList" as const },
  { href: "/gallery?tab=works", key: "gallery" as const, labelOverride: "Realizacje" },
  { href: "/about", key: "about" as const },
  { href: "/contacts", key: "contacts" as const },
];

const mobileNav = [
  ...desktopNav,
  { href: "/booking", key: "booking" as const },
  { href: "/promocje", key: "promos" as const },
  { href: "/faq", key: "faq" as const },
];

export function Header() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const labelFor = (item: (typeof desktopNav)[number]) => {
    if ("labelOverride" in item && item.labelOverride && locale === "pl") {
      return item.labelOverride;
    }
    return t.nav[item.key];
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-bm-black/90 backdrop-blur-md safe-area-pt">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
        <Logo size="sm" showTagline={false} />

        <nav className="hidden items-center gap-1 lg:flex">
          {desktopNav.map((item) => {
            const isGallery = item.href.startsWith("/gallery");
            const active = isGallery ? pathname === "/gallery" : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "text-white" : "text-bm-silver hover:text-white"
                )}
              >
                {labelFor(item)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher compact />
          <PhoneLink
            trackSource="header"
            className="text-sm font-semibold text-white hover:text-bm-red transition-colors whitespace-nowrap"
          >
            {SITE_NAP.phoneDisplay}
          </PhoneLink>
          <BookingLink
            trackSource="header"
            className="btn-primary text-xs sm:text-sm min-h-[44px] px-4"
          >
            {t.hero.ctaBook}
          </BookingLink>
        </div>

        {/* Mobile: phone + menu */}
        <div className="flex items-center gap-1 lg:hidden">
          <PhoneLink
            trackSource="header_mobile_icon"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white hover:bg-white/5"
            aria-label={t.hero.ctaCall}
          >
            <Phone size={22} />
          </PhoneLink>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white hover:bg-white/5"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-bm-black/98 px-4 py-4 max-h-[min(75vh,calc(100dvh-3.5rem))] overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {mobileNav.map((item) => {
              const isGallery = item.href.startsWith("/gallery");
              const active = isGallery ? pathname === "/gallery" : pathname === item.href;
              const className = clsx(
                "rounded-lg px-4 py-3 text-base min-h-[48px] flex items-center",
                active ? "text-white bg-white/5" : "text-bm-silver"
              );
              if (item.href === "/booking") {
                return (
                  <BookingLink
                    key={item.href}
                    href={item.href}
                    trackSource="nav_mobile"
                    onClick={() => setOpen(false)}
                    className={className}
                  >
                    {labelFor(item as (typeof desktopNav)[number])}
                  </BookingLink>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  {labelFor(item as (typeof desktopNav)[number])}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
            <LanguageSwitcher />
            <BookingLink
              trackSource="header_mobile"
              className="btn-primary text-center min-h-[48px]"
              onClick={() => setOpen(false)}
            >
              {t.hero.ctaBook}
            </BookingLink>
          </div>
        </div>
      )}
    </header>
  );
}
