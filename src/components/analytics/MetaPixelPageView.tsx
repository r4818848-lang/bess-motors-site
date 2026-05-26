"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** PageView on in-app navigation only (initial PageView is in metaPixelInitScript) */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
