"use client";

import Link from "next/link";
import { CalendarDays, CarFront, House, Menu, Tag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

const hiddenPaths = ["/crm", "/mechanic", "/admin", "/sign", "/cabinet", "/booking", "/telegram"];

const labels = {
  pl: { aria: "Nawigacja mobilna", home: "Start", services: "Usługi", book: "Umów wizytę", pricing: "Cennik", menu: "Menu" },
  ru: { aria: "Мобильная навигация", home: "Главная", services: "Услуги", book: "Записаться", pricing: "Цены", menu: "Меню" },
  uk: { aria: "Мобільна навігація", home: "Головна", services: "Послуги", book: "Записатися", pricing: "Ціни", menu: "Меню" },
  en: { aria: "Mobile navigation", home: "Home", services: "Services", book: "Book a visit", pricing: "Prices", menu: "Menu" },
} as const;

/** App-like 5-action dock from the approved mobile mockup.
 *  Its menu delegates to the accessible header modal, not a second nav system.
 */
export function StickyContactBar() {
  const { locale } = useI18n();
  const pathname = usePathname() ?? "";
  if (hiddenPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  const ui = labels[locale];
  const isHome = pathname === "/";
  const isServices = pathname === "/services" || pathname.startsWith("/services/");
  const isPricing = pathname === "/cennik";

  const standard = "flex min-h-[58px] flex-col items-center justify-end gap-1 rounded-xl px-1 pb-2 pt-2 text-[10px] font-semibold leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bm-accent";

  return (
    <nav
      aria-label={ui.aria}
      className="bm-sticky-contact fixed inset-x-0 bottom-0 z-[90] border-t border-white/20 bg-[#10141b]/95 px-2 pt-1 shadow-[0_-12px_45px_rgba(0,0,0,.5)] backdrop-blur-xl safe-area-pb md:hidden"
      data-testid="mobile-action-bar"
    >
      <div className="mx-auto grid max-w-lg grid-cols-[1fr_1fr_1.4fr_1fr_1fr] items-end gap-0.5">
        <Link href="/" aria-current={isHome ? "page" : undefined} className={standard + (isHome ? " text-bm-accent" : " text-bm-copy hover:text-white")}>
          <House size={23} aria-hidden />
          <span>{ui.home}</span>
        </Link>

        <Link href="/services" aria-current={isServices ? "page" : undefined} className={standard + (isServices ? " text-bm-accent" : " text-bm-copy hover:text-white")}>
          <CarFront size={23} aria-hidden />
          <span>{ui.services}</span>
        </Link>

        <BookingLink
          trackSource="mobile_dock_booking"
          className="bm-btn-primary relative mx-auto -mt-5 flex h-[86px] w-[86px] max-w-full flex-col items-center justify-center gap-1 rounded-full border border-[#ff6b65]/60 px-1 text-center text-[11px] font-bold leading-tight shadow-[0_0_26px_rgba(225,6,0,.32)]"
        >
          <CalendarDays size={26} aria-hidden />
          <span>{ui.book}</span>
        </BookingLink>

        <Link href="/cennik" aria-current={isPricing ? "page" : undefined} className={standard + (isPricing ? " text-bm-accent" : " text-bm-copy hover:text-white")}>
          <Tag size={23} aria-hidden />
          <span>{ui.pricing}</span>
        </Link>

        <button
          type="button"
          onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="mobile-nav-toggle"]')?.click()}
          className={standard + " text-bm-copy hover:text-white"}
          aria-label={ui.menu}
          data-testid="mobile-bottom-menu"
        >
          <Menu size={23} aria-hidden />
          <span>{ui.menu}</span>
        </button>
      </div>
    </nav>
  );
}
