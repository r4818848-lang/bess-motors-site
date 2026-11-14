"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const serviceLinks = [
  { href: "/wulkanizacja-warszawa", key: "tires" as const },
  { href: "/wymiana-oleju", key: "oil" as const },
  { href: "/hamulce", key: "brakePads" as const },
  { href: "/diagnostyka", key: "diagnostic" as const },
  { href: "/klimatyzacja", key: "acRefill" as const },
  { href: "/zawieszenie", key: "suspension" as const },
  { href: "/silnik", key: "engine" as const },
];

export function Header() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.nav = "open";
    return () => {
      document.body.style.overflow = prev;
      delete document.body.dataset.nav;
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open && !servicesOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setServicesOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (!open || event.key !== "Tab") return;
      const menu = menuRef.current;
      if (!menu) return;
      const items = [...menu.querySelectorAll<HTMLElement>("a, button")];
      if (menuButtonRef.current) items.push(menuButtonRef.current);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, servicesOpen]);

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  const labelFor = (item: (typeof desktopNav)[number]) => {
    if ("labelOverride" in item && item.labelOverride && locale === "pl") {
      return item.labelOverride;
    }
    return t.nav[item.key];
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-area-pt">
      <div
        className={clsx(
          "border-b transition-colors duration-200",
          scrolled || pathname !== "/"
            ? "border-white/10 bg-bm-black/80 backdrop-blur-md"
            : "border-transparent bg-transparent"
        )}
      >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
        <Logo size="sm" showTagline={false} />

        <nav className="hidden items-center gap-1 lg:flex">
          <div className="relative">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm text-bm-silver hover:text-white min-h-[44px]"
              aria-expanded={servicesOpen}
              aria-controls="header-services"
              onClick={() => setServicesOpen((value) => !value)}
            >
              {t.nav.services}
            </button>
            <div
                id="header-services"
                hidden={!servicesOpen}
                className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-white/10 bg-bm-black/95 p-2 shadow-lg"
              >
                {serviceLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm text-bm-silver hover:bg-white/5 hover:text-white min-h-[44px]"
                    onClick={() => setServicesOpen(false)}
                  >
                    {t.serviceItems[item.key]}
                  </Link>
                ))}
                <Link
                  href="/services"
                  className="mt-1 block rounded-lg border-t border-white/10 px-3 py-2 text-sm text-white min-h-[44px]"
                  onClick={() => setServicesOpen(false)}
                >
                  {t.nav.services}
                </Link>
              </div>
          </div>
          {desktopNav.filter((item) => item.href !== "/services").map((item) => {
            const isGallery = item.href.startsWith("/gallery");
            const active = isGallery ? pathname === "/gallery" : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm transition-colors",
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
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-white hover:text-bm-ink transition-colors whitespace-nowrap"
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
            ref={menuButtonRef}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      </div>

      {open && mounted
        ? createPortal(
        <div id="mobile-nav" ref={menuRef} className="fixed inset-x-0 bottom-0 top-14 z-[120] overflow-y-auto bg-[#090b0e] px-4 py-4 pb-28 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label={t.nav.services}>
            {serviceLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-base min-h-[48px] flex items-center text-bm-silver"
              >
                {t.serviceItems[item.key]}
              </Link>
            ))}
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
        </div>,
        document.body
        )
        : null}
    </header>
  );
}
