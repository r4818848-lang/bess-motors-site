"use client";

import { useCallback, useEffect, useState } from "react";
import { syncAppointmentsFromCloud } from "@/lib/cloud-appointments";
import { DB_CHANGED_EVENT } from "@/lib/db-events";

/** Download server appointments into localStorage (CRM + cabinet, all devices) */
export function useCloudAppointmentsSync(enabled = true): {
  cloudReady: boolean;
  resync: () => Promise<void>;
} {
  const [cloudReady, setCloudReady] = useState(false);

  const resync = useCallback(async () => {
    const ok = await syncAppointmentsFromCloud();
    if (ok) {
      window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
    }
    setCloudReady(ok);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void resync();
    const interval = setInterval(() => void resync(), 60_000);
    return () => clearInterval(interval);
  }, [enabled, resync]);

  return { cloudReady, resync };
}
