"use client";

import { useEffect } from "react";

/** Runs callback on an interval only while the document tab is visible */
export function useVisibleInterval(
  callback: () => void,
  ms: number,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;

    let id: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };

    const start = () => {
      if (id || document.hidden) return;
      id = setInterval(callback, ms);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [callback, ms, enabled]);
}
