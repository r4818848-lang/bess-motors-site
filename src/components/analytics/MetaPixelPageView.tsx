"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { fireFbq } from "@/lib/meta-pixel";

/** PageView on in-app navigation only (initial PageView is in metaPixelInitScript) */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    fireFbq("PageView");
  }, [pathname]);

  return null;
}
