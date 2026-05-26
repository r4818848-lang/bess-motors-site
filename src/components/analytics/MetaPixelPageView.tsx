"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Re-fire PageView on client-side route changes (Next.js App Router) */
export function MetaPixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
