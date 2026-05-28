"use client";

import { useEffect } from "react";
import { captureReferralFromUrl } from "@/lib/referral-capture";

export function ReferralCapture() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);
  return null;
}
