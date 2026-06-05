"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { fireYmHit } from "@/lib/yandex-metrika";

/** Hit on in-app navigation (initial view is tracked by ym init). */
export function YandexMetrikaPageView() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    fireYmHit(window.location.href);
  }, [pathname]);

  return null;
}
