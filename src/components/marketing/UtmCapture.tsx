"use client";

import { useEffect } from "react";
import { captureUtmFromUrl } from "@/lib/utm";

export function UtmCapture() {
  useEffect(() => {
    captureUtmFromUrl();
  }, []);
  return null;
}
