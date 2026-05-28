"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { fireGaPageView } from "@/lib/gtag";

/** page_view on in-app navigation (initial page_view is handled by GA script config) */
export function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    fireGaPageView(pathname);
  }, [pathname]);

  return null;
}

