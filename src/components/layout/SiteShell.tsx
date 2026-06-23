"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AcSummerPromoBar } from "@/components/home/AcSummerPromoBar";
import { StickyContactBar } from "@/components/layout/StickyContactBar";
import { BookNowSticky } from "@/components/layout/BookNowSticky";
import { WhatsAppFloatingButton } from "@/components/layout/WhatsAppFloatingButton";

const MINIMAL_CHROME_PREFIXES = ["/crm", "/admin", "/mechanic", "/sign"];

function usesMinimalChrome(pathname: string): boolean {
  return MINIMAL_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

const NO_MOBILE_STICKY_PREFIXES = ["/booking", "/cennik"];

function hidesMobileStickyBar(pathname: string): boolean {
  return NO_MOBILE_STICKY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";

  if (usesMinimalChrome(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  const hideMobileBar = hidesMobileStickyBar(pathname);

  return (
    <div className="min-h-screen overflow-x-clip">
      <Header />
      {pathname === "/" ? <AcSummerPromoBar /> : null}
      <main
        className={
          hideMobileBar ? "min-h-screen" : "min-h-screen pb-[4.5rem] md:pb-0"
        }
      >
        {children}
      </main>
      <Footer />
      <StickyContactBar />
      <BookNowSticky />
      <WhatsAppFloatingButton />
    </div>
  );
}
