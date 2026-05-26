"use client";

import { useEffect } from "react";
import { trackMetaViewContent } from "@/lib/meta-pixel";

/** Fire Meta ViewContent once when a page mounts */
export function useMetaViewContent(contentName: string): void {
  useEffect(() => {
    trackMetaViewContent(contentName);
  }, [contentName]);
}
